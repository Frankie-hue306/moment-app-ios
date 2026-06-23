#!/bin/bash
LOG=/tmp/cleanup_$(date +%Y%m%d).log
echo "=== 自动清理 $(date) ===" > $LOG

# 系统缓存
rm -rf ~/Library/Caches/@cfmindeasyclaw-updater 2>/dev/null
rm -rf ~/Library/Caches/node-gyp 2>/dev/null
rm -rf ~/Library/Caches/GeoServices 2>/dev/null
rm -rf ~/Library/Caches/com.apple.helpd 2>/dev/null
echo "缓存清理完成" >> $LOG

# 临时文件
find /private/tmp -mtime +1 -delete 2>/dev/null
echo "临时文件清理完成" >> $LOG

# 废纸篓
rm -rf ~/.Trash/* 2>/dev/null
echo "废纸篓清空" >> $LOG

# 系统日志（保留7天）
find ~/Library/Logs -name "*.log" -mtime +7 -delete 2>/dev/null
echo "旧日志清理完成" >> $LOG

# 下载文件夹（删除超过30天的DMG/ZIP/PDF安装包）
find ~/Downloads -name "*.dmg" -mtime +30 -delete 2>/dev/null
find ~/Downloads -name "*.zip" -mtime +30 -delete 2>/dev/null
echo "旧安装包清理完成" >> $LOG

# 报告释放的空间
AVAIL=$(df -h / | tail -1 | awk '{print $4}')
echo "磁盘可用: $AVAIL" >> $LOG
echo "=== 清理结束 ===" >> $LOG
