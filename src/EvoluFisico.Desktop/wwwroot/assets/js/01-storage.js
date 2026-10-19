/* Safe Storage Fallback para ambientes restritos / iframes / opaque origins */
(function() {
    try {
        var t = window.localStorage;
        t.setItem('__ef_storage_probe__', '1');
        t.removeItem('__ef_storage_probe__');
    } catch(e) {
        console.warn('[EvoluFísico] Armazenamento temporário: dados não persistem após recarregar.');
        window.EF_TEMPORARY_STORAGE = true;
        var _mem = {};
        var _mock = {
            getItem: function(k) { return Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null; },
            setItem: function(k, v) { _mem[k] = String(v); },
            removeItem: function(k) { delete _mem[k]; },
            clear: function() { _mem = {}; },
            key: function(i) { return Object.keys(_mem)[i] || null; },
            get length() { return Object.keys(_mem).length; }
        };
        try {
            Object.defineProperty(window, 'localStorage', {
                value: _mock,
                configurable: true,
                enumerable: true,
                writable: true
            });
        } catch(err) {
            window.localStorage = _mock;
        }
    }
})();
