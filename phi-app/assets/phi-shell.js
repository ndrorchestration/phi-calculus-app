// assets/phi-shell.js — injected into every page's <body> onload
// Builds the persistent top nav and marks the active route

(function () {
    const NAV_ITEMS = [
        { label: 'Overview',  href: '/',           icon: '⬡' },
        { label: 'Viz',       href: '/viz/',        icon: '◈' },
        { label: 'Evaluator', href: '/evaluator/',  icon: '⟁' },
        { label: 'Docs',      href: '/docs/',       icon: '≡' },
    ];

    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

    const navHTML = `
    <nav id="phi-nav">
        <div class="phi-nav-inner">
            <a class="phi-nav-brand" href="/">
                LAV<span class="gold">Ξ</span>NDER
                <span class="phi-nav-sub">· PHI-CALCULUS</span>
            </a>
            <div class="phi-nav-links">
                ${NAV_ITEMS.map(item => {
                    const href = item.href.replace(/\/$/, '') || '/';
                    const active = (href === '/' ? currentPath === '/' : currentPath.startsWith(href))
                        ? 'active' : '';
                    return `<a class="phi-nav-link ${active}" href="${item.href}">
                        <span class="phi-nav-icon">${item.icon}</span>${item.label}
                    </a>`;
                }).join('')}
            </div>
            <div class="phi-nav-badge">v2.0</div>
        </div>
    </nav>`;

    // Inject nav as first child of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Push body content below nav height (52px)
    document.body.style.paddingTop = '52px';
})();
