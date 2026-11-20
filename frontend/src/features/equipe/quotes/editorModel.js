// Turns what is written in the editor (HTML of a contentEditable) into the blocks the server builds Word and PDF files from:
// { kind: p | h1 | h2 | ul | ol, align, runs: [{ text, bold, italic, underline }] }.
const ALIGNS = ['left', 'center', 'right', 'justify'];

function format(node, inherited) {
  const style = node.style || {};
  const tag = node.nodeName.toLowerCase();
  return {
    bold: inherited.bold || tag === 'b' || tag === 'strong' || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
    italic: inherited.italic || tag === 'i' || tag === 'em' || style.fontStyle === 'italic',
    underline: inherited.underline || tag === 'u' || String(style.textDecoration || style.textDecorationLine || '').includes('underline'),
  };
}

// The text of a block as runs; a line break becomes \n and a block inside a block (a <div> in a <li>) ends the line.
function runsOf(node, inherited, runs = []) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      if (child.textContent) runs.push({ text: child.textContent.replace(/ /g, ' '), ...inherited });
    } else if (child.nodeType === 1) {
      if (child.nodeName === 'BR') runs.push({ text: '\n', ...inherited });
      else runsOf(child, format(child, inherited), runs);
    }
  }
  return runs;
}

function alignOf(element) {
  const value = element.style?.textAlign || element.getAttribute?.('align') || 'left';
  return ALIGNS.includes(value) ? value : 'left';
}

// A table: its rows and cells (a <th> is a header cell, data-shade="grey" a shaded one), column widths and borders from data- attributes.
function tableBlock(table) {
  const plain = { bold: false, italic: false, underline: false };
  const rows = [...table.querySelectorAll('tr')].map(row => [...row.children].filter(cell => /^t[dh]$/i.test(cell.nodeName)).map(cell => {
    const parts = [...cell.childNodes].some(child => child.nodeType === 1 && /^(p|div)$/i.test(child.nodeName)) ? [...cell.children] : [cell];
    const runs = [];
    parts.forEach((part, index) => {
      if (index) runs.push({ text: '\n', ...plain });
      runsOf(part, format(part, format(cell, plain)), runs);
    });
    const shade = cell.nodeName === 'TH' ? 'violet' : cell.dataset?.shade === 'grey' ? 'grey' : 'none';
    return { runs, align: alignOf(cell), shade, span: Math.min(8, Math.max(1, Number(cell.getAttribute('colspan')) || 1)) };
  }));
  const widths = String(table.dataset?.widths || '').split(',').map(Number).filter(width => width > 0);
  return { kind: 'table', align: 'left', runs: [], rows: rows.filter(row => row.length), widths, borders: table.dataset?.borders === 'none' ? 'none' : 'grid' };
}

const BLOCKS = /^(p|div|h[1-6]|ul|ol|li|blockquote|table)$/;
const hasBlocks = element => [...element.children].some(child => BLOCKS.test(child.nodeName.toLowerCase()));

const kindFor = (tag, parent) => (tag === 'h1' || tag === 'h2' ? tag : /^h[3-6]$/.test(tag) ? 'h2' : parent === 'ul' || parent === 'ol' ? parent : 'p');

// Browsers sometimes nest blocks (a <ul> inside a <p>, a <div> inside a <li>): such an element is opened and its blocks read one by one.
export function toBlocks(root) {
  const blocks = [];
  const plain = { bold: false, italic: false, underline: false };
  const add = (kind, element, align) => {
    const runs = runsOf(element, format(element, plain));
    // a lone <br> is an empty line; the trailing line break the browser adds is dropped
    if (runs.length && runs[runs.length - 1].text === '\n') runs.pop();
    if (!runs.length && !element.querySelector?.('br')) return; // an empty block left by nesting, not a blank line
    blocks.push({ kind, align: element.style?.textAlign || element.getAttribute?.('align') ? alignOf(element) : align, runs });
  };
  const walk = (parent, kind, align) => {
    let loose = []; // text and inline elements between blocks
    const flush = () => {
      const text = loose.map(node => node.textContent).join('');
      if (text.trim()) {
        const holder = { childNodes: loose, style: {}, nodeName: 'P' };
        blocks.push({ kind, align, runs: runsOf(holder, plain) });
      }
      loose = [];
    };
    for (const node of parent.childNodes) {
      const tag = node.nodeName.toLowerCase();
      if (node.nodeType === 1 && BLOCKS.test(tag)) {
        flush();
        const inner = node.style?.textAlign || node.getAttribute('align') ? alignOf(node) : align;
        if (tag === 'table') blocks.push(tableBlock(node));
        else if (tag === 'ul' || tag === 'ol') walk(node, tag, inner);
        else if (hasBlocks(node)) walk(node, kindFor(tag, kind), inner);
        else add(kindFor(tag, kind), node, inner);
      } else if (node.nodeType === 3 || node.nodeType === 1) loose.push(node);
    }
    flush();
  };
  walk(root, 'p', 'left');
  return blocks;
}

const blockText = block => block.kind === 'table' ? block.rows.map(row => row.map(cell => cell.runs.map(run => run.text).join('')).join('\t')).join('\n') : block.runs.map(run => run.text).join('');
export const plainText = blocks => blocks.map(blockText).join('\n');
