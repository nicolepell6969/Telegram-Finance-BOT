module.exports = {
    apps: [{
        name: 'finance-bot',
        script: './bot.js',
        cwd: '/root/finance-bot',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production'
        },
        error_file: './logs/error.log',
        out_file: './logs/output.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        // Restart delay
        min_uptime: '10s',
        max_restarts: 10,
        restart_delay: 4000
    }]
};
