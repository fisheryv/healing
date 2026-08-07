"""
音频调性分析脚本
使用 chroma 特征 + Krumhansl-Schmuckler 调性轮廓算法，
分析 10 首主音乐的主音和大小调，输出可直接粘贴到 data.js 的结果。
"""
import os
import numpy as np
import librosa

MUSIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'sound', 'music')

TRACKS = [
    ('m1',  'Glass Rain'),
    ('m2',  'Still Dance'),
    ('m3',  'Thread of Dawn'),
    ('m4',  'Distant Shore'),
    ('m5',  'Cloud Altar'),
    ('m6',  'Sun Vessel'),
    ('m7',  'Soft Ember'),
    ('m8',  'May Nocturne'),
    ('m9',  'Moss & Pine'),
    ('m10', 'Moon Garden'),
]

PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Krumhansl-Kessler 调性轮廓
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def analyze_key(y, sr):
    """用 chroma + Krumhansl-Schmuckler 轮廓检测调性"""
    # 计算 chroma（色度特征，12维对应12个音级）
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)  # 时间平均 → 12维向量

    scores = []
    for i in range(12):
        rotated = np.roll(chroma_mean, -i)
        maj_corr = float(np.corrcoef(rotated, MAJOR_PROFILE)[0, 1])
        min_corr = float(np.corrcoef(rotated, MINOR_PROFILE)[0, 1])
        scores.append((maj_corr, min_corr))

    # 收集所有 24 个候选调性并排序
    all_keys = []
    for i in range(12):
        all_keys.append((scores[i][0], i, 'major'))
        all_keys.append((scores[i][1], i, 'minor'))
    all_keys.sort(reverse=True)

    return all_keys, chroma_mean


print('=' * 78)
print('音频调性分析结果 (Krumhansl-Schmuckler)')
print('=' * 78)
print(f"{'id':<6}{'name':<20}{'key':<6}{'mode':<8}{'corr':<8}{'alt_key':<16}{'alt_corr':<8}{'gap':<8}")
print('-' * 78)

results = []

for tid, name in TRACKS:
    path = os.path.join(MUSIC_DIR, f'{tid}.mp3')
    if not os.path.exists(path):
        print(f'{tid:<6}{name:<20}FILE NOT FOUND')
        continue

    # 加载音频（前 90 秒，足够检测调性）
    y, sr = librosa.load(path, sr=22050, duration=90, mono=True)

    all_keys, chroma_mean = analyze_key(y, sr)

    best = all_keys[0]
    alt = all_keys[1]
    gap = best[0] - alt[0]

    key_name = PITCH_NAMES[best[1]]
    mode_str = best[2]
    alt_name = PITCH_NAMES[alt[1]] + '/' + alt[2]

    print(f'{tid:<6}{name:<20}{key_name:<6}{mode_str:<8}{best[0]:<8.4f}{alt_name:<16}{alt[0]:<8.4f}{gap:<8.4f}')

    results.append((tid, name, key_name, mode_str, best[0], gap,
                    PITCH_NAMES[alt[1]], alt[2], alt[0]))

print()
print('=' * 78)
print('可直接粘贴到 data.js 的 officialMusic')
print('=' * 78)
print()

for tid, name, key_name, mode_str, corr, gap, alt_key, alt_mode, alt_corr in results:
    flag = ''
    if gap < 0.03:
        flag = f'  // low confidence (gap={gap:.3f}), alt={alt_key}/{alt_mode}({alt_corr:.3f}), verify!'
    print(f"  {{ id: '{tid}',  name: '{name}',"
          f" key: '{key_name}',  mode: '{mode_str}' }},{flag}")

print()
print('说明:')
print('  - corr  = 最优调性的轮廓相关性，越高越确定')
print('  - gap   = 最优与次优调性的相关性差值，越大越确定')
print('  - gap < 0.03 标注为低置信度，建议人工试听复核次选调性')
