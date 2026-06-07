# -*- coding: utf-8 -*-
"""
Created on Sun Oct  1 00:21:38 2023
"""
# %%
import os
import re
import json
from datetime import datetime
import pyperclip


def sanitize_filename(filename, replacement=""):
    # 定义不允许出现在文件名中的字符的正则表达式
    forbidden_chars = r'[<>:"/\\|?*\x00-\x1F]'
    # 使用正则表达式替换不满足文件命名格式的符号
    sanitized_filename = re.sub(forbidden_chars, replacement, filename)
    return sanitized_filename


def get_filenames(data_main_ex, file_path):
    frame_id_names = [element['name']
                      for element in data_main_ex['elements'] if element.get('type') == 'frame']

    filenames = []
    Nonenum = 1
    for frame_id_name in frame_id_names:
        file_origin_name = os.path.basename(file_path).replace(".md", "")
        if type(frame_id_name) == type(None):
            filenames.append(sanitize_filename(
                f"{file_origin_name}_Frame{Nonenum}"))
            Nonenum += 1
        else:
            filenames.append(sanitize_filename(
                f"{file_origin_name}_{frame_id_name}"))
            Nonenum += 1
    print(filenames)
    return filenames


def Excalidraw_list_el_id(data, el_key, el_value, el_id="id"):

    # 创建一个空列表来存储type为"frame"的元素的id号
    frame_ids = []

    # 遍历elements列表
    for element in data['elements']:
        # 检查元素的"type"属性是否等于"frame"
        if element.get(el_key) == el_value:
            # 如果是，则将该元素的"id"添加到frame_ids列表中
            frame_ids.append(element[el_id])
    return frame_ids


def printid(frame_ids):
    # 输出id号
    i = 1
    for frame_id in frame_ids:
        print(i, frame_id)
        i += 1


def get_frame_ids(data_main_ex):
    el_key = "type"
    el_value = "frame"
    frame_ids = Excalidraw_list_el_id(data_main_ex, el_key, el_value)
    printid(frame_ids)
    return frame_ids


def get_list_frame_els(data_main_ex, frame_ids):
    el_key = "type"
    el_value = "frame"
    list_frame_els = {}
    for frame_id in frame_ids:
        print("🍀", frame_id)
        el_key = "frameId"
        el_value = frame_id
        frame_el_ids = Excalidraw_list_el_id(data_main_ex, el_key, el_value)
        # 输出id号
        list_els = []
        i = 1
        for frame_el_id in frame_el_ids:
            list_els.append(frame_el_id)
            print(i, frame_el_id)
            i += 1
        list_frame_els[frame_id] = list_els
    return list_frame_els


def output_ex_frame_json(data, frame_ids, filenames):
    output_ex_jsons = []
    for id_num in range(len(frame_ids)):

        frame_id = frame_ids[id_num]  # 替换为要提取的frameId
        # 查找包含指定frameId的元素
        frame_elements = [element for element in data['elements']
                          if element.get('frameId') == frame_id]
        if frame_elements:
            # 创建一个新的字典，只包含包含指定frameId的元素和其他不变的元素
            frame_data = {
                'type': data['type'],
                'version': data['version'],
                'source': data['source'],
                'elements': frame_elements,
                'appState': data['appState'],
                'files': data['files']
            }
            # json.dump(frame_data, file, indent=4)
            output_ex_jsons.append(frame_data)
        else:
            print("未找到包含指定frameId的元素")
    return output_ex_jsons

# 提取frame_data_json对应id的文本


def extract_text_for_Excalidraw(file_path_content, pattern):
    # 使用正则表达式提取指定文本
    match = re.search(pattern, file_path_content)
    if match:
        return match.group(1)
    else:
        return None

# 对提取id的文本进行匹配text段


def extract_lines_with_ids(match_text, text_ids, linebreak):
    # 将match_text按行分割为列表
    try:
        lines = match_text.split('\n')
    except:
        lines = []

    # 初始化一个空列表用于存储选定的行
    selected_lines = []

    # 遍历每一行
    for line in lines:
        # 检查该行是否包含text_ids中的任一元素
        for id in text_ids:
            if id in line:
                # 如果包含，则将该行添加到selected_lines列表中
                selected_lines.append(line)
                break

    # 组合为new_text，每行之间以空行隔开
    new_text = linebreak.join(selected_lines)
    return new_text


def extraction_text_and_file(file_path_content, output_ex_jsons, filenames, file_dir, file_foldernote_path):

    # 创建foldernote
    file_foldernote_yaml = "---\ncssclasses:\n  - list-cards\n---\n"
    with open(file_foldernote_path, 'w', encoding='utf-8') as file:
        file.write(file_foldernote_yaml)

    i = 0
    for output_ex_json in output_ex_jsons:
        filename = filenames[i]
        print(f"\n🍀{filename}")

        i = i+1
        pattern = r'(---\n[\w\W]*---\n==[\w\W]*==\n)'
        match_yml = extract_text_for_Excalidraw(file_path_content, pattern)

        # 提取Text Elements的id
        el_key = "type"
        el_value = "text"
        text_ids = Excalidraw_list_el_id(output_ex_json, el_key, el_value)
        # print(text_ids)

        # 提取Embedded files的id
        el_value = "image"
        file_ids = Excalidraw_list_el_id(
            output_ex_json, el_key, el_value, "fileId")

        # 调用函数进行文本提取和保存 new_text
        pattern = r'# Text Elements\n([\w\W]*)# Embedded files'
        match_text = extract_text_for_Excalidraw(file_path_content, pattern)
        # new_texts = extract_lines_with_ids(match_text, text_ids, "\n") # 存在问题：只能匹配单行文本
        # 为方便使用，直接匹配全文，靠Excalidraw自动修正
        new_texts = match_text

        # 调用函数进行文本提取和保存 match_files
        pattern = r'# Embedded files\n([\w\W]*)%%\n# Drawing'
        match_files = extract_text_for_Excalidraw(file_path_content, pattern)
        new_files = extract_lines_with_ids(match_files, file_ids, "\n")

        # 将frame_data转换为JSON格式的字符串
        frame_data_json = json.dumps(
            output_ex_json, indent=4, ensure_ascii=False)

        save_data = [match_yml, "\n# Text Elements", new_texts, "\n# Embedded files",
                     new_files, "%%\n# Drawing\n```json", frame_data_json, "```\n%%"]
        # 将提取的元素保存到新的md文件中
        output_json_path = f"{file_dir}\{filename}.md"

        # 创建Frames卡片
        with open(output_json_path, 'w', encoding='utf-8') as file:
            file.write('\n'.join(save_data))

        # 插入导航链接
        with open(file_foldernote_path, 'a+', encoding='utf-8') as file:
            file.write(f"- [[{filename}]]\n")


def all_extraction_frame(file_path, file_dir, file_foldernote_path):
    # 读取.md文件
    with open(file_path, 'r', encoding="utf-8") as file:
        file_path_content = file.read()

    # 使用正则表达式匹配文本
    pattern = r"%%\n# Drawing\n```json\n({[\w\W]+})\n```\n%%"
    matches = re.findall(pattern, file_path_content)

    # 将匹配的文本保存为json数据
    if matches:
        data_main_ex = json.loads(matches[0])
    else:
        print("未找到匹配的文本")
        # return

    filenames = get_filenames(data_main_ex, file_path)
    frame_ids = get_frame_ids(data_main_ex)

    output_ex_jsons = output_ex_frame_json(data_main_ex, frame_ids, filenames)

    # 创建输出目录
    extraction_text_and_file(file_path_content, output_ex_jsons,
                             filenames, file_dir, file_foldernote_path)


# %%%
if __name__ == '__main__':

    # 获取剪贴板中的路径文本
    file_path = pyperclip.paste()
    print(file_path)

    # 创建输出路径为该Excalidraw路径下的文件名路径
    file_basename = os.path.basename(file_path).replace(".md", "")
    file_basedir = os.path.dirname(file_path)
    file_output_dir = f"{file_basedir}\Frames_{file_basename}"
    # 创建输出目录（如果不存在）
    os.makedirs(file_output_dir, exist_ok=True)

    # 创建导航foldernote文件路径
    file_foldernote_path = f"{file_output_dir}\Frames_{file_basename}.md"

    # 输入文件路径、输出路径、foldernote路径
    all_extraction_frame(file_path, file_output_dir, file_foldernote_path)
