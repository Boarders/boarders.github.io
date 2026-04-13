/* Position tactic proof-state panels using viewport coordinates so they
   always appear correctly below (or above) the tactic span, even when the
   span wraps across multiple lines. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tactic-block').forEach(el => {
    const panel = el.querySelector('.lean-proof-state');
    if (!panel) return;

    el.addEventListener('mouseenter', () => {
      const rect = el.getBoundingClientRect();

      /* Measure panel height before revealing it */
      panel.style.visibility = 'hidden';
      panel.style.display    = 'block';
      const panelH = panel.offsetHeight;
      panel.style.display    = '';
      panel.style.visibility = '';

      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= panelH + 8
        ? rect.bottom + 4                  /* below the element */
        : rect.top - panelH - 4;          /* flip above */

      panel.style.top     = top + 'px';
      panel.style.left    = rect.left + 'px';
      panel.style.display = 'block';
    });

    el.addEventListener('mouseleave', () => {
      panel.style.display = '';
      panel.style.top     = '';
      panel.style.left    = '';
    });
  });

  /* Collapsible sections for [lean-section: Prefix, hide] */
  document.querySelectorAll('.lean-embed[data-hide]').forEach(embed => {
    const items = Array.from(embed.querySelectorAll('.lean-item'));
    if (!items.length) return;

    const rawLabel = embed.dataset.hide;
    const label    = (rawLabel && rawLabel !== '1') ? rawLabel + ' details' : 'details';

    const wrapper = document.createElement('span');
    wrapper.className = 'lean-proof-body';
    wrapper.style.display = 'none';
    items[0].parentNode.insertBefore(wrapper, items[0]);
    items.forEach(item => wrapper.appendChild(item));

    const btn = document.createElement('button');
    btn.className = 'lean-proof-toggle';
    btn.textContent = '▸ ' + label;
    btn.addEventListener('click', () => {
      const isHidden = wrapper.style.display === 'none';
      wrapper.style.display = isHidden ? '' : 'none';
      btn.textContent = (isHidden ? '▾ ' : '▸ ') + label;
    });
    wrapper.parentNode.insertBefore(btn, wrapper);
  });

  /* Collapsible proof bodies for [lean-embed: Name, hide-proof] */
  document.querySelectorAll('.lean-embed[data-hide-proof]').forEach(embed => {
    embed.querySelectorAll('.lean-item').forEach(item => {
      const code = item.querySelector('pre.hl.lean code');
      if (!code) return;

      /* Walk direct children of <code> to find the first '\n' after ':='.
         ':=' is a plain text node (not a keyword span), so we detect it
         in text nodes. The '\n' we want is also a direct-child text node
         that appears after the ':= by' tactic-block. */
      let foundAssign = false;
      let splitNode = null;
      let splitIdx  = -1;
      for (const child of code.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!foundAssign) {
            const ai = child.textContent.indexOf(':=');
            if (ai !== -1) {
              foundAssign = true;
              /* '\n' might also appear in this same text node after ':=' */
              const nl = child.textContent.indexOf('\n', ai + 2);
              if (nl !== -1) { splitNode = child; splitIdx = nl; break; }
            }
          } else {
            const nl = child.textContent.indexOf('\n');
            if (nl !== -1) { splitNode = child; splitIdx = nl; break; }
          }
        }
      }
      if (!splitNode) return;

      /* Use a Range to extract everything from that '\n' to end-of-code.
         Range.extractContents handles partial-node splits cleanly, so the
         visible part keeps ':= by' and the hidden part starts at the newline. */
      const range = document.createRange();
      range.setStart(splitNode, splitIdx);
      range.setEndAfter(code.lastChild);
      const fragment = range.extractContents();

      const proofBody = document.createElement('span');
      proofBody.className = 'lean-proof-body';
      proofBody.appendChild(fragment);
      proofBody.style.display = 'none';

      /* Toggle button */
      const btn = document.createElement('button');
      btn.className = 'lean-proof-toggle';
      btn.textContent = '▸ proof';
      btn.addEventListener('click', () => {
        const isHidden = proofBody.style.display === 'none';
        proofBody.style.display = isHidden ? '' : 'none';
        btn.textContent = isHidden ? '▾ proof' : '▸ proof';
      });

      code.appendChild(document.createTextNode('\n'));
      code.appendChild(btn);
      code.appendChild(proofBody);
    });
  });
});
