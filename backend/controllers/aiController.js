const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Training = require('../models/Training');
const { DateTime } = require('luxon');

// @desc    Get AI Insights for Workforce
// @route   GET /api/ai/insights
const getAIInsights = async (req, res) => {
    try {
        const employees = await Employee.find({ active: true }).populate('skills');
        const monthStart = DateTime.now().startOf('month').toJSDate();

        const insights = {
            promotionCandidates: [],
            burnoutRisk: [],
            trainingRecommendations: []
        };

        for (const emp of employees) {
            // 1. Promotion Analysis
            const completedTasks = await Task.countDocuments({ assignedTo: emp._id, status: 'completed' });
            const completedTrainings = await Training.countDocuments({
                'attendees.employee': emp._id,
                'attendees.status': 'Completed'
            });

            if (emp.gamification.points > 500 || (completedTasks > 10 && completedTrainings > 2)) {
                insights.promotionCandidates.push({
                    name: emp.name,
                    id: emp.employeeId,
                    score: emp.gamification.points,
                    reason: 'High performance metrics and skill growth'
                });
            }

            // 2. Burnout Analysis
            const recentAttendance = await Attendance.find({
                employee: emp._id,
                date: { $gte: monthStart }
            });
            const avgHours = recentAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0) / (recentAttendance.length || 1);

            if (avgHours > 9.5) {
                insights.burnoutRisk.push({
                    name: emp.name,
                    id: emp.employeeId,
                    avgHours: avgHours.toFixed(1),
                    risk: 'High',
                    advice: 'Recommend a 2-day break'
                });
            }

            // 3. Training Recommendation (Simplified)
            if (emp.skills.length < 3) {
                insights.trainingRecommendations.push({
                    name: emp.name,
                    recommended: emp.position === 'Developer' ? 'Advanced Cloud Architecture' : 'Strategic Team Leadership',
                    gap: 'Core Skill Diversity'
                });
            }
        }

        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAIInsights };
