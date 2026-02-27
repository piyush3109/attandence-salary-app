// Sample Plugin: Loyalty Bonus Rule
module.exports = {
    init: (app) => {
        // Register a special route or attach to existing logic
        app.get('/api/plugins/loyalty-bonus', (req, res) => {
            res.json({
                rule: 'Loyalty Bonus',
                description: 'Employees with 1 year+ tenure get 5% bonus',
                calculation: '(tenure > 365) ? salary * 0.05 : 0'
            });
        });
    }
};
