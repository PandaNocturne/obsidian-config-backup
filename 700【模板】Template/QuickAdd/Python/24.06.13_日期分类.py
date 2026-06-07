import os
import shutil

# 源文件夹路径
source_dir = r'D:\PandaNotes\900【素材】Assets\910_ObsidianAssets\2023'

# 遍历源文件夹中的所有文件夹
for root, dirs, files in os.walk(source_dir):
    for dir_name in dirs:
        # 获取文件夹的完整路径
        dir_path = os.path.join(root, dir_name)
        
        # 提取文件夹的年份和月份信息
        year_month = dir_name[:7]
        
        # 目标文件夹路径
        target_dir = os.path.join(source_dir, year_month)
        
        # 如果目标文件夹不存在，则创建
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
        
        # 移动文件夹到目标文件夹
        shutil.move(dir_path, target_dir)
        
        print(f"移动文件夹 {dir_path} 到 {target_dir}")

print("所有文件夹移动完成")
