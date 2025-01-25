const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.json()); // 解析 JSON 格式的数据
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码的数据

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 配置MySQL连接
const db = mysql.createConnection({
    host: 'mysql.sqlpub.com', // MySQL 服务器地址
    user: 'user00', // MySQL 用户名
    password: 'cJEna7XotYoe9iFi', // MySQL 密码
    database: 'my_user' // 数据库名称
});

// 连接到MySQL
db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        throw err;
    }
    console.log('MySQL connected...');
});

// 处理根路径的GET请求
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 处理注册请求
app.post('/register', async (req, res) => {
    try {
        console.log('Request body:', req.body); // 打印整个请求体

        const { username, password, 'confirm-password': confirmPassword } = req.body;

        console.log(`Username: ${username}, Password: ${password}, Confirm Password: ${confirmPassword}`);

        if (password !== confirmPassword) {
            return res.status(400).send('<h1>密码和确认密码不一致</h1>');
        }

        // 对密码进行哈希处理
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Database insert error:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('<h1>用户名已存在</h1>');
                }
                return res.status(500).send('<h1>数据库插入错误</h1>');
            }

            return res.send('<h1>注册成功！</h1>');
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).send('<h1>服务器内部错误</h1>');
    }
});

// 处理登录请求
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const sql = 'SELECT * FROM users WHERE username = ?';
        db.query(sql, [username], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('<h1>数据库查询错误</h1>');
            }

            if (results.length === 0) {
                return res.status(400).send('<h1>用户名不存在</h1>');
            }

            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(400).send('<h1>密码错误</h1>');
            }

            return res.send('<h1>登录成功！</h1>');
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).send('<h1>服务器内部错误</h1>');
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});