import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function perf(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        await client.enablePerformance();
        const metrics = await client.getPerformanceMetrics();
        const metricsList = metrics.metrics || [];
        if (options.json) {
            console.log(JSON.stringify(metricsList, null, 2));
            return;
        }
        console.log(chalk.blue('Performance Metrics\n'));
        const rows = metricsList.map((m) => {
            const formatted = typeof m.value === 'number'
                ? (m.value >= 1000 ? `${(m.value / 1000).toFixed(2)}s` : `${m.value.toFixed(2)}ms`)
                : String(m.value);
            return { name: m.name, value: formatted };
        });
        // Group related metrics
        const groups = {
            Timings: ['Timestamp', 'DomContentLoaded', 'FirstMeaningfulPaint', 'FirstPaint', 'FirstContentfulPaint', 'LargestContentfulPaint'],
            Layout: ['LayoutCount', 'LayoutDuration', 'RecalcStyleCount', 'RecalcStyleDuration'],
            Script: ['ScriptDuration', 'JSEventListeners', 'JSEventListenerCount', 'JSTotalExecutionTime'],
            Rendering: ['CompositeLayersDuration', 'CompositedLayerCount', 'CumulativeLayoutShift', 'AnimationDuration'],
            Memory: ['JSHeapUsedSize', 'JSHeapTotalSize', 'PrivateMemory', 'DocumentCount'],
            Network: ['TaskDuration', 'TaskCount', 'Nodes', 'Resources', 'ContextCount'],
        };
        for (const [groupName, keys] of Object.entries(groups)) {
            const groupMetrics = rows.filter((r) => keys.includes(r.name));
            if (groupMetrics.length > 0) {
                console.log(chalk.yellow(`  ${groupName}:`));
                for (const m of groupMetrics) {
                    console.log(`    ${m.name.padEnd(35)} ${m.value}`);
                }
                console.log();
            }
        }
        // Print any ungrouped metrics
        const allGrouped = new Set(Object.values(groups).flat());
        const ungrouped = rows.filter((r) => !allGrouped.has(r.name));
        if (ungrouped.length > 0) {
            console.log(chalk.yellow('  Other:'));
            for (const m of ungrouped) {
                console.log(`    ${m.name.padEnd(35)} ${m.value}`);
            }
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=perf.js.map