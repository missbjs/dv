import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { buildSnapshotLines, anchorRefs } from '../snapshot.js';
export async function find(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        await client.enableAccessibility();
        const axResult = await client.getFullAXTree();
        const existingRefs = await anchorRefs(client, axResult.nodes);
        const result = buildSnapshotLines(axResult.nodes, existingRefs);
        // Search for matching elements
        const matches = [];
        for (const [, entry] of result.refs) {
            if (matchesLocator(entry, options.mode, options.value)) {
                matches.push(entry);
            }
        }
        if (matches.length === 0) {
            console.log(chalk.yellow(`No elements found matching ${options.mode}="${options.value}"`));
            return;
        }
        // If no action, just list matches
        if (!options.action) {
            if (options.json) {
                console.log(JSON.stringify(matches.map(m => ({ ref: m.ref, role: m.role, name: m.name, backendDOMNodeId: m.backendDOMNodeId })), null, 2));
            }
            else {
                console.log(chalk.blue(`Found ${matches.length} matching element(s):\n`));
                for (const m of matches) {
                    console.log(`  ${chalk.cyan(m.ref)} ${chalk.yellow(m.role)} ${chalk.green(`"${m.name}"`)}`);
                }
            }
            return;
        }
        // Use the first match for the action
        const match = matches[0];
        if (match.backendDOMNodeId === undefined) {
            console.error(chalk.red(`Element ${match.ref} has no DOM node`));
            process.exit(1);
        }
        switch (options.action) {
            case 'click': {
                console.log(chalk.blue(`Clicking: ${match.role} "${match.name}" (${match.ref})`));
                await client.clickBackendNode(match.backendDOMNodeId);
                console.log(chalk.green('Clicked'));
                break;
            }
            case 'fill': {
                if (!options.actionValue) {
                    console.error(chalk.red('--value is required for fill action'));
                    process.exit(1);
                }
                console.log(chalk.blue(`Filling: ${match.role} "${match.name}" (${match.ref}) ← "${options.actionValue}"`));
                await client.fillBackendNode(match.backendDOMNodeId, options.actionValue);
                console.log(chalk.green('Filled'));
                break;
            }
            case 'type': {
                if (!options.actionValue) {
                    console.error(chalk.red('--value is required for type action'));
                    process.exit(1);
                }
                console.log(chalk.blue(`Typing: ${match.role} "${match.name}" (${match.ref}) ← "${options.actionValue}"`));
                await client.typeBackendNode(match.backendDOMNodeId, options.actionValue);
                console.log(chalk.green('Typed'));
                break;
            }
            case 'inspect': {
                const el = await client.inspectBackendNode(match.backendDOMNodeId);
                console.log(chalk.green(`\n${match.ref} ${match.role} "${match.name}"`));
                console.log(chalk.gray(`Node ID: ${el.nodeId}`));
                if (el.attributes && el.attributes.length > 0) {
                    console.log(chalk.gray('\nAttributes:'));
                    for (let i = 0; i < el.attributes.length; i += 2) {
                        console.log(chalk.white(`  ${el.attributes[i]}="${el.attributes[i + 1]}"`));
                    }
                }
                break;
            }
            case 'text': {
                const text = await client.getNodeTextByBackendNode(match.backendDOMNodeId);
                console.log(text || '(empty)');
                break;
            }
            case 'html': {
                const html = await client.getOuterHTMLByBackendNode(match.backendDOMNodeId);
                console.log(html.outerHTML || '(empty)');
                break;
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
function matchesLocator(entry, mode, value) {
    const lowerValue = value.toLowerCase();
    switch (mode) {
        case 'text':
            return entry.name.toLowerCase().includes(lowerValue);
        case 'role':
            return entry.role.toLowerCase() === lowerValue;
        case 'label': {
            // Check for aria-label or labelledby property
            const label = entry.properties?.['labelledby'] || entry.name || '';
            return label.toLowerCase().includes(lowerValue);
        }
        case 'placeholder': {
            // Accessible placeholder is stored in the value or describedby
            const placeholder = entry.value || entry.properties?.['describedby'] || '';
            return placeholder.toLowerCase().includes(lowerValue);
        }
        case 'testid': {
            // Check if the data-dv-ref attribute exists (the ref itself is a test id)
            // Also check for data-testid in the accessible description
            return entry.properties?.['describedby']?.toLowerCase().includes(lowerValue) ||
                entry.ref.toLowerCase() === lowerValue;
        }
        default:
            return false;
    }
}
//# sourceMappingURL=find.js.map