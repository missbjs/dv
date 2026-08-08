import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { buildSnapshotLines, anchorRefs, compareRefs } from '../snapshot.js';
import fs from 'fs';
export async function diff(options) {
    if (options.files) {
        // Compare two saved JSON snapshot files
        const [file1, file2] = options.files;
        let snap1, snap2;
        try {
            snap1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
            snap2 = JSON.parse(fs.readFileSync(file2, 'utf8'));
        }
        catch (error) {
            console.error(chalk.red(`Error reading files: ${error instanceof Error ? error.message : error}`));
            process.exit(1);
        }
        const result = computeSnapshotDiff(snap1.refs || {}, snap2.refs || {});
        printDiff(result);
        return;
    }
    if (options.compare) {
        // Compare current tab with a saved snapshot
        const client = new CDPClient(getPortFromProfile(options.profile));
        try {
            await client.connect();
            await client.enableAccessibility();
            const axResult = await client.getFullAXTree();
            const existingRefs = await anchorRefs(client, axResult.nodes);
            const currentResult = buildSnapshotLines(axResult.nodes, existingRefs);
            let savedData;
            try {
                savedData = JSON.parse(fs.readFileSync(options.compare, 'utf8'));
            }
            catch (error) {
                console.error(chalk.red(`Error reading ${options.compare}: ${error instanceof Error ? error.message : error}`));
                process.exit(1);
            }
            const currentRefs = {};
            for (const [key, entry] of currentResult.refs) {
                currentRefs[key] = {
                    ref: entry.ref,
                    role: entry.role,
                    name: entry.name,
                    value: entry.value,
                    properties: entry.properties,
                };
            }
            const result = computeSnapshotDiff(currentRefs, savedData.refs || {});
            printDiff(result);
            if (options.output) {
                fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
                console.log(chalk.gray(`\nDiff saved to ${options.output}`));
            }
        }
        finally {
            await client.close();
        }
        return;
    }
    // No files — we need at least something to compare
    console.error(chalk.red('Specify either --files or --compare'));
    console.error(chalk.gray('  dv4 diff --files snap1.json snap2.json'));
    console.error(chalk.gray('  dv4 diff --compare saved-snapshot.json'));
    process.exit(1);
}
function computeSnapshotDiff(refs1, refs2) {
    const keys1 = new Set(Object.keys(refs1));
    const keys2 = new Set(Object.keys(refs2));
    const added = [];
    const removed = [];
    const changed = [];
    let unchanged = 0;
    // Find removed (in refs1 but not refs2)
    for (const key of keys1) {
        if (!keys2.has(key)) {
            removed.push(refs1[key]);
        }
    }
    // Find added (in refs2 but not refs1)
    for (const key of keys2) {
        if (!keys1.has(key)) {
            added.push(refs2[key]);
        }
    }
    // Find changed (in both, but different)
    for (const key of keys1) {
        if (keys2.has(key)) {
            const a = refs1[key];
            const b = refs2[key];
            const diffs = [];
            if (a.role !== b.role)
                diffs.push(`role: ${a.role} → ${b.role}`);
            if (a.name !== b.name)
                diffs.push(`name: "${a.name}" → "${b.name}"`);
            if (a.value !== b.value)
                diffs.push(`value: ${a.value} → ${b.value}`);
            // Compare properties
            const propsA = a.properties || {};
            const propsB = b.properties || {};
            const allProps = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);
            for (const prop of allProps) {
                if (propsA[prop] !== propsB[prop]) {
                    diffs.push(`${prop}: ${propsA[prop]} → ${propsB[prop]}`);
                }
            }
            if (diffs.length > 0) {
                changed.push({ ref: key, before: a, after: b, changes: diffs });
            }
            else {
                unchanged++;
            }
        }
    }
    // Sort by ref
    const sortRef = (a, b) => compareRefs(a.ref, b.ref);
    added.sort(sortRef);
    removed.sort(sortRef);
    changed.sort((a, b) => compareRefs(a.ref, b.ref));
    return { added, removed, changed, unchanged };
}
function printDiff(diff) {
    console.log(chalk.bold('Snapshot Diff'));
    console.log('='.repeat(40));
    if (diff.added.length > 0) {
        console.log(chalk.green(`\n+ Added (${diff.added.length}):`));
        for (const entry of diff.added) {
            console.log(chalk.green(`  + ${entry.ref} ${entry.role} "${entry.name}"`));
        }
    }
    if (diff.removed.length > 0) {
        console.log(chalk.red(`\n− Removed (${diff.removed.length}):`));
        for (const entry of diff.removed) {
            console.log(chalk.red(`  − ${entry.ref} ${entry.role} "${entry.name}"`));
        }
    }
    if (diff.changed.length > 0) {
        console.log(chalk.yellow(`\n~ Changed (${diff.changed.length}):`));
        for (const { ref, changes } of diff.changed) {
            console.log(chalk.yellow(`  ~ ${ref}:`));
            for (const change of changes) {
                console.log(chalk.gray(`      ${change}`));
            }
        }
    }
    console.log(chalk.blue(`\nUnchanged: ${diff.unchanged}`));
    const total = diff.added.length + diff.removed.length + diff.changed.length + diff.unchanged;
    if (total > 0) {
        console.log(chalk.gray(`Total: ${total} elements`));
    }
    if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
        console.log(chalk.green('No differences found — snapshots are identical.'));
    }
}
//# sourceMappingURL=diff.js.map