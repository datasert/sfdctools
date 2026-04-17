#!/usr/bin/env node

/**
 * End-to-end SF CLI reference doc generator.
 *
 * Steps:
 *   1. Updates SF CLI to the latest version via `sf update`
 *   2. Runs `sf commandreference generate` to produce DITA XML files
 *   3. Parses all XML files into structured JSON
 *   4. Writes JSON to public/sf-cli-reference.json for use by UI code
 *
 * Usage: node scripts/sfcli-docs-generator.mjs
 *    or: bash scripts/sfcli-docs-generator.sh
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DITA_DIR = path.join(ROOT, 'docs/sf-cli-reference');
const OUTPUT_FILE = path.join(ROOT, 'public/sf-cli-reference.json');

const SF_PLUGINS = [
  '@salesforce/plugin-apex',
  '@salesforce/plugin-deploy-retrieve',
  '@salesforce/plugin-org',
  '@salesforce/plugin-data',
  '@salesforce/plugin-auth',
  '@salesforce/plugin-user',
  '@salesforce/plugin-packaging',
  '@salesforce/plugin-sobject',
  '@salesforce/plugin-limits',
  '@salesforce/plugin-schema',
  '@salesforce/plugin-settings',
  '@salesforce/plugin-templates',
  '@salesforce/plugin-agent',
  '@salesforce/plugin-api',
];

// ─── Step 1: Update SF CLI ───────────────────────────────────────────────────

function getSfVersion() {
  try {
    const result = spawnSync('sf', ['version', '--json'], { encoding: 'utf8' });
    const data = JSON.parse(result.stdout);
    return data.cliVersion ? data.cliVersion.split('/').pop() : 'unknown';
  } catch {
    return 'unknown';
  }
}

function updateSfCli() {
  console.log('Updating SF CLI to latest...');
  const updateResult = spawnSync('sf', ['update'], { encoding: 'utf8', stdio: 'inherit' });
  if (updateResult.status !== 0) {
    console.warn('SF CLI update failed or already up to date, continuing...');
  }

  console.log('Ensuring plugin-command-reference is installed...');
  const pluginCheck = spawnSync('sf', ['plugins', 'list'], { encoding: 'utf8' });
  if (!pluginCheck.stdout.includes('plugin-command-reference')) {
    console.log('Installing @salesforce/plugin-command-reference...');
    const install = spawnSync(
      'sh', ['-c', 'echo y | sf plugins install @salesforce/plugin-command-reference'],
      { encoding: 'utf8', stdio: 'inherit' }
    );
    if (install.status !== 0) {
      console.error('Failed to install plugin-command-reference.');
      process.exit(1);
    }
  }

  const version = getSfVersion();
  console.log(`SF CLI version: ${version}`);
  return version;
}

// ─── Step 2: Generate DITA XML ──────────────────────────────────────────────

function generateDita() {
  console.log('Generating DITA XML from SF CLI...');
  const pluginArgs = SF_PLUGINS.flatMap(p => ['-p', p]);
  const args = ['commandreference', 'generate', ...pluginArgs, '--output-dir', DITA_DIR];
  const result = spawnSync('sf', args, { encoding: 'utf8', cwd: ROOT });
  if (result.status !== 0) {
    console.error('sf commandreference generate failed:');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  console.log('DITA generation complete.');
}

// ─── Step 3: Parse XML ───────────────────────────────────────────────────────

function getText(node) {
  if (!node) return '';
  let text = '';
  for (const child of Array.from(node.childNodes || [])) {
    if (child.nodeType === 3) {
      text += child.nodeValue;
    } else if (child.nodeType === 1) {
      text += getText(child);
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

function getElements(node, tagName) {
  if (!node) return [];
  const results = [];
  const nodes = node.getElementsByTagName(tagName);
  for (let i = 0; i < nodes.length; i++) results.push(nodes.item(i));
  return results;
}

function parseFlags(refbody) {
  const flags = [];
  for (const entry of getElements(refbody, 'dlentry')) {
    const dtNode = entry.getElementsByTagName('dt').item(0);
    if (!dtNode) continue;

    const names = getElements(dtNode, 'codeph').map(c => getText(c)).filter(Boolean);
    const shortFlag = names.find(n => /^-[^-]$/.test(n));
    const longFlag = names.find(n => n.startsWith('--'));

    const dds = getElements(entry, 'dd');
    const required = dds.some(dd => getText(dd) === 'Required');
    const typeNode = dds.find(dd => getText(dd).startsWith('Type:'));
    const defaultNode = dds.find(dd => getText(dd).startsWith('Default value:'));
    const valuesNode = dds.find(dd => getText(dd).startsWith('Permissible values are:'));
    const descNode = dds.find(dd => dd.getElementsByTagName('p').length > 0);

    flags.push({
      flag: longFlag || shortFlag || names[0] || '',
      shorthand: shortFlag && longFlag ? shortFlag : null,
      required,
      type: typeNode ? getText(typeNode).replace('Type:', '').trim() : null,
      default: defaultNode ? getText(defaultNode).replace('Default value:', '').trim() : null,
      options: valuesNode
        ? getText(valuesNode).replace('Permissible values are:', '').trim().split(',').map(v => v.trim())
        : null,
      description: descNode
        ? getElements(descNode, 'p').map(p => getText(p)).filter(Boolean).join(' ') || null
        : null,
    });
  }
  return flags;
}

function parseExamples(section) {
  const examples = [];
  let currentDesc = [];
  for (const child of Array.from(section.childNodes || [])) {
    if (child.nodeType !== 1) continue;
    if (child.tagName === 'p') {
      currentDesc.push(getText(child));
    } else if (child.tagName === 'codeblock') {
      examples.push({ description: currentDesc.join(' ').trim() || null, command: getText(child) });
      currentDesc = [];
    }
  }
  return examples;
}

function parseCommandXml(filePath, category) {
  const content = fs.readFileSync(filePath, 'utf8');
  const doc = new DOMParser().parseFromString(content, 'text/xml');
  const ref = doc.getElementsByTagName('reference').item(0);
  if (!ref) return null;

  const title = getText(ref.getElementsByTagName('title').item(0));
  if (!title) return null;

  const shortdesc = getText(ref.getElementsByTagName('shortdesc').item(0));
  const refbody = ref.getElementsByTagName('refbody').item(0);
  if (!refbody) return null;

  let description = [], examples = [], flags = [], aliases = [];

  for (const section of getElements(refbody, 'section')) {
    const sectionTitle = getText(section.getElementsByTagName('title').item(0));
    if (sectionTitle.startsWith('Description')) {
      description = getElements(section, 'p').map(p => getText(p)).filter(Boolean);
    } else if (sectionTitle.startsWith('Examples')) {
      examples = parseExamples(section);
    } else if (sectionTitle === 'Flags') {
      flags = parseFlags(section);
    } else if (sectionTitle.startsWith('Aliases')) {
      aliases = getElements(section, 'codeblock').map(c => getText(c)).filter(Boolean);
    }
  }

  return {
    command: title,
    category,
    summary: shortdesc,
    description: description.join('\n\n') || null,
    flags,
    examples,
    aliases,
  };
}

function isCommandFile(filename) {
  return (
    filename.endsWith('.xml') &&
    !filename.endsWith('.ditamap') &&
    !filename.match(/cli_reference_\w+_commands_unified\.xml/) &&
    filename !== 'cli_reference_unified.xml' &&
    filename !== 'cli_reference_help_unified.xml'
  );
}

function parseDita() {
  console.log('Parsing DITA XML files...');
  const commands = [];

  for (const entry of fs.readdirSync(DITA_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const categoryDir = path.join(DITA_DIR, entry.name);
    for (const file of fs.readdirSync(categoryDir).filter(isCommandFile)) {
      const parsed = parseCommandXml(path.join(categoryDir, file), entry.name);
      if (parsed) commands.push(parsed);
    }
  }

  commands.sort((a, b) => a.command.localeCompare(b.command));
  console.log(`Parsed ${commands.length} commands.`);
  return commands;
}

// ─── Step 4: Write output ────────────────────────────────────────────────────

function buildCategoryIndex(commands) {
  const index = {};
  for (const cmd of commands) {
    if (!index[cmd.category]) index[cmd.category] = [];
    index[cmd.category].push(cmd.command);
  }
  return index;
}

function writeOutput(commands, sfVersion) {
  const output = {
    cliVersion: sfVersion,
    generated: new Date().toISOString(),
    totalCommands: commands.length,
    categories: buildCategoryIndex(commands),
    commands,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  const sizeKb = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
  console.log(`Wrote ${commands.length} commands (${sizeKb} KB) → ${OUTPUT_FILE}`);
  console.log(`SF CLI version: ${sfVersion}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

const sfVersion = updateSfCli();
generateDita();
const commands = parseDita();
writeOutput(commands, sfVersion);
