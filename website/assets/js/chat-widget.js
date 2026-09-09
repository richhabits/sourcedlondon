/* =========================================================
   Customer-facing AI chat widget. Renders on every public
   page. Calls the buyer's own ai-proxy Edge Function, so it
   silently does nothing (no bubble shown) until AI is set up.
   ========================================================= */

(function () {
  const history = [];

  function buildWidget() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button id="cd-chat-toggle" class="wa-float" style="right:88px; background:var(--gold); color:#141414;" aria-label="Chat with the Sourced London assistant">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>
      <div id="cd-chat-panel" hidden style="position:fixed; right:20px; bottom:88px; width:320px; max-width:calc(100vw - 40px); height:420px; background:var(--surface); border:1px solid var(--border-strong); border-radius:8px; box-shadow:0 16px 48px rgba(0,0,0,0.5); z-index:61; display:flex; flex-direction:column; overflow:hidden;">
        <div style="padding:14px 16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-family:var(--font-display); color:var(--gold-bright);">Sourced London Assistant</strong>
          <button id="cd-chat-close" style="background:none;border:0;color:var(--muted);font-size:1.2rem;cursor:pointer;">✕</button>
        </div>
        <div id="cd-chat-log" style="flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px; font-size:0.88rem;"></div>
        <form id="cd-chat-form" style="display:flex; gap:8px; padding:12px; border-top:1px solid var(--border);">
          <input id="cd-chat-input" type="text" placeholder="Ask about a make, model, or how it works..." style="flex:1; background:var(--bg-alt); border:1px solid var(--border-strong); color:var(--ivory); border-radius:4px; padding:10px 12px; font-family:var(--font-body); font-size:0.85rem;">
          <button type="submit" class="btn btn-primary" style="padding:10px 16px;">Send</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    const toggle = document.getElementById("cd-chat-toggle");
    const panel = document.getElementById("cd-chat-panel");
    const closeBtn = document.getElementById("cd-chat-close");
    const form = document.getElementById("cd-chat-form");
    const input = document.getElementById("cd-chat-input");
    const log = document.getElementById("cd-chat-log");

    function addBubble(role, text) {
      const b = document.createElement("div");
      b.style.cssText = `max-width:85%; padding:8px 12px; border-radius:10px; line-height:1.45; ${
        role === "user"
          ? "align-self:flex-end; background:var(--gold-dim); color:var(--ivory);"
          : "align-self:flex-start; background:var(--surface-2); color:var(--ivory-dim); border:1px solid var(--border);"
      }`;
      b.textContent = text;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
    }

    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden && log.children.length === 0) {
        addBubble("assistant", "Hi — I'm the Sourced London assistant. Ask me about a make/model or how buying through us works.");
      }
    });
    closeBtn.addEventListener("click", () => (panel.hidden = true));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addBubble("user", text);
      history.push({ role: "user", text });
      input.value = "";
      addBubble("assistant", "…");
      const thinkingBubble = log.lastChild;
      try {
        const res = await window.SourcedLondon.callEdgeFunction("ai-proxy", { prompt: text, mode: "chat", history });
        thinkingBubble.textContent = res.text;
        history.push({ role: "assistant", text: res.text });
      } catch (err) {
        thinkingBubble.textContent = "Sorry, the assistant isn't reachable right now — try WhatsApp or the contact form instead.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.SourcedLondon || !window.SourcedLondon.isBackendConfigured()) return;
    buildWidget();
  });
})();
