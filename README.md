# akoa

# 配置
将config.sample.js配置信息补全并改名为config.js才能启动。
# 启动
```bash
cd /var
git clone https://github.com/alwxkxk/akoa
cd akoa
npm install 
#先配置config/config.js
pm2 start /var/akoa/src/app.js --name akoa --max-memory-restart 256M
```