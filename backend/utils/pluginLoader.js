const fs = require('fs');
const path = require('path');

const loadPlugins = (app) => {
    const pluginDir = path.join(__dirname, '../plugins');
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

    const files = fs.readdirSync(pluginDir);
    const plugins = [];

    files.forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const plugin = require(path.join(pluginDir, file));
                if (plugin.init) {
                    plugin.init(app);
                    plugins.push({ name: file, status: 'Active' });
                }
            } catch (error) {
                console.error(`Failed to load plugin ${file}:`, error.message);
            }
        }
    });

    console.log(`Loaded ${plugins.length} plugins.`);
    return plugins;
};

module.exports = { loadPlugins };
