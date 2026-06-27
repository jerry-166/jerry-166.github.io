---
title: 当AI学会用你的声音骗你：《迷魅狩猎》技术拆解与代码复现
date: 2026-06-17
description: 深度拆解MIMESIS的AI三层架构（感知→决策→执行），性格系统设计，RL+SLM混合决策引擎，附完整Python代码复现。
tags: [MIMESIS, AI, 游戏, NLP, SLM, RL, Python]
author: Jerry
---

# 当AI学会用你的声音骗你：《迷魅狩猎》技术拆解与代码复现

> 你听到队友在门口喊"安全，进来"，开门后等着你的却是一个伪装成队友的怪物——因为它一直在偷听你们的语音。

## 01 这是什么游戏？

《迷魅狩猎》（MIMESIS）是KRAFTON旗下ReLU Games开发的4人协作生存恐怖游戏。2025年10月Steam抢先体验，50天销量破100万份，2026年获日本CEDEC Awards游戏设计优秀奖——首个获此殊荣的韩国游戏。

核心卖点只有一个：**AI驱动的拟态者（Mimesis）会偷听你的语音、模仿你的行为，然后混入队伍骗你。**

### 游戏档案

![MIMESIS官方宣传图](/images/mimesis/tech-promo.jpg)

![MIMESIS游戏场景](/images/mimesis/tech-scene.jpg)

| 项目 | 信息 |
|------|------|
| 开发商 | ReLU Games（KRAFTON旗下） |
| 类型 | 四人协作生存恐怖 |
| 平台 | Steam（抢先体验） |
| 上线时间 | 2025年10月27日 |
| 售价 | 国区 ¥28.50（史低） |
| Steam好评率 | 84%（7654评测） |
| 最高在线 | 8,407人 |
| 销量 | 抢先体验50天突破100万份 |
| 荣誉 | CEDEC Awards 2026 游戏设计优秀奖（首款获此殊荣的韩国游戏） |

### 玩法简介

![MIMESIS游戏实机截图](/images/mimesis/tech-screenshot.jpg)

游戏设定在被"诅咒之雨"笼罩的世界——淋到雨的人会被复制，产生名为"Mimesis"的拟态者。玩家扮演幸存者，4人组队在危险环境中搜集废料修理老旧电车逃出生天。

听起来像普通的coop生存恐怖？区别在于：**Mimesis不是按脚本行动的传统怪物**。它由AI实时驱动，会：

- **监听玩家语音**：学习你们之间的交流方式和暗语
- **模仿玩家行为**：复刻你的声音、动作甚至记忆
- **混入队伍伪装**：在信任与猜疑的临界点制造心理恐怖

想象一下：你听到队友在门口喊"安全，进来"，开门后等着你的却是一个伪装成队友的怪物——因为它一直在偷听你们的战术沟通。

每局体验都不同，因为AI会根据你的队伍行为动态调整策略，无法"背板通关"。ReLU Games CEO Min-jung Kim 说："AI不是用来'做更多'的工具，而是用来'重新定义什么值得做'的设计语言。"

## 02 AI到底怎么实现的？三层架构拆解

ReLU Games官方说法是"超越传统行为树的context-aware AI"，结合CEDEC报道和TOS条款，我拆出了三层架构：

![AI三层架构图](https://po-img.processon.com/chart_image/diss/file/full/img?imgId=6a3fd4af94bbcf7f7828bf62&from=po_tool_ai_dissfile)

> 📐 [点击编辑此架构图](https://www.processon.com/thirds/dissociate/6a3fd4af94bbcf7f7828bf62?category=flow&partner=poToolAIFlow&poInfo=FLOn3gdjbOVVLduesU9v93nnIaXpEC6qeFa-yNyBQ5DeOAU70-HpW2dDYL1q8yj5EOXCb_i07J3tV8NgNshsQIGLXbqYX2FtaHxQrRBPyWViGJ9MH7xfhNMXv1xZoSQ-Vp-55HCcU8ObVJ-xE76BdvIOD1dfgNrWn6HcL-iutKU&partnerFlag=8b81a164d2f1d441ea4670c1546d59cc)

### 第一层：感知层——环境数据采集

游戏TOS中明确定义了"Environmental Data"：

> Environmental Data refers to contextual information such as your character's in-game location, triggered events, sensor readings, and the status of nearby objects.

也就是说，AI每时每刻都在采集：
- **玩家位置**：谁在哪、距离多远
- **语音片段**：录下语音聊天的音频片段
- **事件触发**：谁开了门、谁拾取了物品
- **周围物体状态**：掩体、光源、可交互对象

⚠️ **关键澄清**：TOS同时声明——"The AI does not update itself, evolve, or learn in real time based on your interactions." 即**AI不会在对局中实时进化**，对局数据用于离线训练改进模型。

### 第二层：决策层——RL + SLM 混合架构

CEDEC获奖报道提到MIMESIS使用**强化学习（RL）+ 小型语言模型（SLM）**驱动决策。结合开发者在Fami通采访中的描述：

> 「ミメシスの音声会話における核となる要素は、『どのセリフを、いつ発話するか』を判断する意思決定能力にある。ミメシスはつねにその瞬間の状況を認識・分析し、プレイヤーをもっとも効果的に欺けるタイミングにおいて、最適なセリフを選択して再生する。」

翻译过来就是：**说什么、什么时候说**——这是AI决策的核心。Mimesis持续识别分析当前局势，在最能欺骗玩家的时机，选择最合适的台词回放。

决策层的关键设计：
- **RL负责导航和战斗策略**：接近玩家的路径选择、突袭时机
- **SLM负责对话选择**：根据语境从已录制的语音库中选择最合适的片段
- **行为树兜底**：非战斗行为（搜索装备、交换物品）仍用传统BT

![AI决策流程图](https://po-img.processon.com/chart_image/diss/file/full/img?imgId=6a3fd4d356a07e788d02f758&from=po_tool_ai_dissfile)

> 📐 [点击编辑此流程图](https://www.processon.com/thirds/dissociate/6a3fd4d356a07e788d02f758?category=flow&partner=poToolAIFlow&poInfo=iTYQiwd0052viiGf2qaVY253s5D_3j_lLa01Ym5oqxlSB3uIx1jB9rit5oc7yWeRI4CMqMxUqrm27VXYHLiWJuJ1m-fKCbI_az7Ua_XYMwYPoS7y2_XyA7JW-noh8AEuzsoXgz0mDGSOYoWdRVl2CxGYldHdud370WsWGUCVNDw&partnerFlag=c1247714a261fb8ba70d1103b199fa86)

### 第三层：执行层——个体性格 + 语音回放

这是最新更新的核心设计——每个Mimesis个体拥有独特的性格参数：

| 性格参数 | 作用 |
|---------|------|
| 警觉阈值 | 多近的距离开始关注玩家 |
| 模仿倾向 | 偏好模仿语音还是模仿动作 |
| 攻击激进度 | 主动攻击 vs 潜伏欺骗 |
| 社交试探风格 | 如何试探玩家（延迟回应/高频模仿/环境误导） |

新怪物变体：
- **回响者（Echoer）**：声波干扰，可短暂扰乱语音通讯
- **静默织影（Umbravore）**：光学拟态，在特定表面实现视觉伪装

## 03 最大的争议：语音到底是不是AI生成的？

**不是。**

这是社区最犀利的发现。一位Steam 2小时评测玩家说得一针见血：

> "This game in no way uses generative AI to recreate or clone your friends' voices. The mechanism is entirely reliant on simple voice recording and playback. The game records your voice as you talk and plays back exactly what you said, and exactly how you said it. This is a voice recording technique, and this technology was invented in 1877."

翻译：这游戏**根本没用生成式AI**来克隆你朋友的声音。机制完全依赖简单的录音和回放。游戏录下你说的话，然后原封不动地回放。这是1877年发明的录音技术。

**但这不意味着AI没有参与**——AI参与的是**决策**：从你说的所有话里，选哪句、什么时机回放，才能最大程度欺骗你的队友。这是"录什么"和"用什么"的区别。

**设计哲学**：ReLU Games CEO说"AI不是用来'做更多'的工具，而是用来'重新定义什么值得做'的设计语言"。从这个角度看，录放+智能选择的组合，在当前技术条件下确实比实时语音克隆更可控——延迟更低、不会出现幻觉、不会说出玩家从未说过的内容（那反而更容易被识破）。

## 04 简版代码复现：Mimesis AI 核心逻辑

以下Python代码演示了Mimesis AI的核心感知-决策-执行循环。不是游戏源码（闭源商业项目），而是基于公开技术资料逆向还原的逻辑模型。

---

### 4.1 感知层：数据结构定义

感知层负责采集环境数据，包括玩家位置、语音片段、事件触发等。

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class EnvironmentalData:
    """环境数据 - 每帧采集的上下文信息"""
    player_positions: dict[str, tuple[float, float]]
    triggered_events: list[str]        # 近期事件
    sensor_readings: dict[str, float]   # 传感器读数
    nearby_objects: dict[str, str]      # 周围物体状态
    voice_clips: list[dict]             # 已录制语音
    round_elapsed: float                # 当前回合时间
    alive_players: int                  # 存活玩家数

@dataclass
class VoiceClip:
    """录制的语音片段"""
    text: str               # 转写文本
    speaker_id: str         # 说话者ID
    audio_data: bytes       # 音频数据
    timestamp: float        # 录制时间
    context: str            # 上下文: "exploring"/"combat"/"gathering"
```

**设计要点**：
- 使用dataclass简化数据结构定义
- `VoiceClip`记录了上下文信息，这是后续SLM选择语音的关键
- 语音片段包含时间戳，用于计算新鲜度

---

### 4.2 感知层：数据采集模块

```python
class PerceptionModule:
    """感知模块 - 采集并预处理环境数据"""

    def __init__(self):
        self.voice_buffer: list[VoiceClip] = []

    def capture_voice(self, text: str, speaker: str, context: str):
        """捕获玩家语音（核心欺骗素材来源）"""
        clip = VoiceClip(
            text=text, speaker_id=speaker,
            audio_data=b"...",
            timestamp=time.time(), context=context
        )
        self.voice_buffer.append(clip)

    def get_situation_snapshot(self, env: EnvironmentalData) -> dict:
        """生成局势快照供决策层使用"""
        return {
            "nearest_player_dist": min(
                ((env.player_positions[p][0])**2 +
                 (env.player_positions[p][1])**2)**0.5
                for p in env.player_positions
            ) if env.player_positions else float('inf'),
            "combat_intensity": env.sensor_readings.get("noise_level", 0),
            "available_clips": len(self.voice_buffer),
            "recent_events": env.triggered_events[-3:],
            "alive_count": env.alive_players,
            "phase": "early" if env.round_elapsed < 120 else "late"
        }
```

**设计要点**：
- `capture_voice`：捕获玩家语音并存储到缓冲区
- `get_situation_snapshot`：将复杂环境数据提炼为决策层可用的特征向量
- 核心特征：最近玩家距离、战斗强度、可用语音数、存活人数、游戏阶段

---

### 4.3 决策层：性格系统

```python
from enum import Enum

class PersonalityProfile(Enum):
    """个体性格 - 每个Mimesis独特的欺骗风格"""
    LURKER = "lurker"          # 潜伏型：沉默跟踪
    MIMIC = "mimic"            # 模仿型：高频语音欺骗
    MANIPULATOR = "manipulator" # 操控型：延迟回应
    AMBUSHER = "ambusher"      # 伏击型：诱导攻击

@dataclass
class PersonalityParams:
    """性格参数 - 决定行为风格的核心变量"""
    alertness_threshold: float = 0.5   # 警觉阈值
    mimicry_tendency: float = 0.5       # 模仿倾向
    aggression_level: float = 0.5       # 攻击激进度
    social_probe_style: str = "delayed" # 社交试探风格
    deception_patience: float = 0.5     # 欺骗耐心
```

**四种性格的核心差异**：

| 性格 | 警觉阈值 | 模仿倾向 | 攻击激进度 | 欺骗耐心 |
|------|---------|---------|-----------|---------|
| LURKER | 0.8（高） | 0.2（低） | 0.3（低） | 0.9（高） |
| MIMIC | 0.5（中） | 0.9（高） | 0.4（低） | 0.3（低） |
| MANIPULATOR | 0.6（中） | 0.6（中） | 0.2（低） | 0.7（高） |
| AMBUSHER | 0.3（低） | 0.4（中） | 0.8（高） | 0.5（中） |

---

### 4.4 决策层：核心决策引擎

```python
class DecisionEngine:
    """决策引擎 - RL+SLM混合决策的核心"""

    def __init__(self, personality: PersonalityProfile):
        self.personality = personality
        self.params = self._init_personality(personality)
        self.stress_index = 0.0  # 压力指数

    def _init_personality(self, profile):
        """根据性格类型初始化参数"""
        configs = {
            PersonalityProfile.LURKER: PersonalityParams(
                alertness_threshold=0.8, mimicry_tendency=0.2,
                aggression_level=0.3, deception_patience=0.9
            ),
            PersonalityProfile.MIMIC: PersonalityParams(
                alertness_threshold=0.5, mimicry_tendency=0.9,
                aggression_level=0.4, deception_patience=0.3
            ),
            # ... MANIPULATOR 和 AMBUSHER 配置类似
        }
        return configs[profile]
```

**决策流程**：
1. 更新压力指数（随时间累积）
2. 评估三种行为得分（接近/攻击/欺骗）
3. 根据性格参数加权选择
4. 若选择欺骗，调用SLM选择最佳语音

---

### 4.5 决策层：行为评估逻辑

```python
def decide(self, snapshot: dict, voice_buffer):
    """核心决策函数"""
    # 1. 更新压力指数
    self.stress_index = min(1.0, self.stress_index + 0.05)

    # 2. 评估三种行为
    approach_score = self._evaluate_approach(snapshot)
    attack_score = self._evaluate_attack(snapshot)
    deceive_score = self._evaluate_deception(snapshot, voice_buffer)

    # 3. 性格偏好加权
    scores = {
        "approach": approach_score * (1 - self.params.aggression_level),
        "attack": attack_score * self.params.aggression_level *
                  (1 + self.stress_index),
        "deceive": deceive_score * self.params.mimicry_tendency,
    }

    action = max(scores, key=scores.get)
    selected_clip = self._select_best_clip(snapshot, voice_buffer) \
                    if action == "deceive" and voice_buffer else None

    return {"action": action, "selected_clip": selected_clip,
            "confidence": max(scores.values()),
            "stress_index": self.stress_index}
```

**关键设计**：
- 压力指数放大攻击性（后期更激进）
- 性格参数作为权重系数，实现差异化行为
- 攻击得分同时受战斗强度和存活人数影响

---

### 4.6 决策层：SLM语音选择

```python
def _select_best_clip(self, snapshot, clips):
    """SLM核心：从语音库选择最佳欺骗片段"""
    scored_clips = []

    for clip in clips:
        score = 0.0
        # 1. 上下文匹配度
        if snapshot["combat_intensity"] > 0.6 and clip.context == "combat":
            score += 0.5
            if any(w in clip.text for w in ["救", "帮", "help", "危险"]):
                score += 0.3  # 战斗中求救语音最有欺骗性
        elif snapshot["combat_intensity"] < 0.3 and clip.context == "exploring":
            score += 0.4
            if any(w in clip.text for w in ["安全", "来", "safe"]):
                score += 0.3  # 探索中安全语音最有欺骗性

        # 2. 新鲜度（5分钟衰减）
        recency = max(0, 1 - (time.time() - clip.timestamp) / 300)
        score += recency * 0.2

        scored_clips.append((clip, score))

    if not scored_clips:
        return None

    scored_clips.sort(key=lambda x: x[1], reverse=True)
    return scored_clips[0][0]
```

**SLM选择策略**：
- **上下文匹配**：战斗时优先选择战斗语音，探索时优先选择探索语音
- **语义匹配**：战斗中"救我"类语音权重更高，探索中"安全"类语音权重更高
- **新鲜度衰减**：最近说的话更可信（5分钟后权重降为0）

---

### 4.7 执行层：状态机

```python
class MimesisEntity:
    """Mimesis实体 - 感知-决策-执行的完整闭环"""

    def __init__(self, personality=PersonalityProfile.MIMIC):
        self.perception = PerceptionModule()
        self.decision = DecisionEngine(personality)
        self.personality = personality
        self.state = "idle"  # idle, approaching, deceiving, attacking

    def tick(self, env: EnvironmentalData) -> dict:
        """每帧执行: 感知 → 决策 → 执行"""
        # 1. 感知
        snapshot = self.perception.get_situation_snapshot(env)

        # 2. 决策
        decision = self.decision.decide(snapshot,
                                        self.perception.voice_buffer)

        # 3. 执行（状态机转换）
        old_state = self.state
        if decision["action"] == "approach":
            self.state = "approaching"
        elif decision["action"] == "deceive":
            self.state = "deceiving"
        elif decision["action"] == "attack":
            self.state = "attacking"

        return {"personality": self.personality.value,
                "state": self.state,
                "state_changed": old_state != self.state,
                "decision": decision,
                "stress_index": self.decision.stress_index}
```

**状态机设计**：
- **idle**：初始状态
- **approaching**：接近玩家
- **deceiving**：播放语音欺骗
- **attacking**：发动攻击

---

### 4.8 验证Demo：模拟游戏流程

```python
def run_demo():
    """模拟一局游戏的AI行为"""
    # 创建四种性格的Mimesis
    entities = {
        "lurker": MimesisEntity(PersonalityProfile.LURKER),
        "mimic": MimesisEntity(PersonalityProfile.MIMIC),
        "manipulator": MimesisEntity(PersonalityProfile.MANIPULATOR),
        "ambusher": MimesisEntity(PersonalityProfile.AMBUSHER),
    }

    # 模拟玩家语音库
    voices = [
        ("这里安全，进来吧", "P1", "exploring"),
        ("找到了好东西", "P2", "exploring"),
        ("我倒了救我", "P2", "combat"),
        ("救我救我！", "P1", "combat"),
        # ... 更多语音片段
    ]

    # 将语音注入所有实体
    for text, speaker, context in voices:
        for entity in entities.values():
            entity.perception.capture_voice(text, speaker, context)

    # 模拟六个阶段的游戏进程
    # Phase 1: 开局探索 → Phase 6: 终局对决
    # 每个阶段更新环境参数，观察AI行为变化
```

---

### 4.9 运行结果示例

```
--- Phase 1: 开局探索 (30s) ---
[lurker]      approaching | 压力: 0.05 | 语音: "None"
[mimic]       deceiving   | 压力: 0.05 | 语音: "快来这里"
[manipulator] deceiving   | 压力: 0.05 | 语音: "快来这里"
[ambusher]    attacking   | 压力: 0.05 | 语音: "None"

--- Phase 4: 战斗爆发 (180s) ---
[lurker]      approaching | 压力: 0.20 | 语音: "None"
[mimic]       deceiving   | 压力: 0.20 | 语音: "救我救我！"
[manipulator] approaching | 压力: 0.20 | 语音: "None"
[ambusher]    deceiving   | 压力: 0.20 | 语音: "救我救我！"

--- Phase 6: 终局对决 (240s) ---
[lurker]      approaching | 压力: 0.30 | 语音: "None"
[mimic]       deceiving   | 压力: 0.30 | 语音: "救我救我！"
```

**观察结论**：
- **LURKER**：始终保持潜伏接近，不轻易使用语音
- **MIMIC**：全程高频语音欺骗，根据局势选择最合适的语音
- **MANIPULATOR**：前期欺骗，后期转为接近策略
- **AMBUSHER**：开局激进攻击，后期转为欺骗诱敌

---

## 05 社区在吵什么？

正方和反方的分歧，本质是**AI在游戏中应该扮演什么角色**的根本分歧：

**正方**：AI终于学会当骗子了。从"背板打Boss"变成"跟会记仇的对手下棋"，每局不可复制。

**反方**：不可预测性拉满后，最安全的策略变成了"尽量少说话"。合作沟通本身变成双刃剑，动摇了合作游戏的核心体验。难度曲线陡升让部分玩家感到"不是被AI打败了，而是被设计打败了"。

这其实是AI Native Game的永恒困境：**可预测性给玩家公平感，不可预测性给玩家新鲜感。两者此消彼长。**

## 06 对AI从业者意味着什么？

1. **"AI原生"不等于"AI生成"**：Mimesis的语音用的是录放而非生成，但决策层是真正的AI。这说明AI在游戏中的价值不在于"做更多"，而在于"做得更聪明"。

2. **RL+SLM是轻量AI NPC的现实方案**：不需要跑70B的大模型，小模型+强化学习就能在特定场景下实现足够好的行为决策。延迟可控、成本可控。

3. **个体性格系统是差异化体验的关键**：同样的感知输入，不同性格的Mimesis做出完全不同的行为——这才是"每局都不一样"的技术基础，而非简单的随机化。

4. **数据闭环但非实时进化**：对局数据用于离线训练而非实时更新，这是兼顾体验质量和运营成本的现实选择。

## 参考

- [ReLU Games Official - MIMESIS Presskit](https://www.relugames.com/mimesis/presskit)
- [Fami通开发者采访 (2025-12-26)](https://www.famitsu.com/article/202512/61668)
- [3DM制作人专访 (2025-11-06)](https://m.3dmgame.com/original/3745756.html)
- [游民星空团队采访 (2025-11-06)](https://wap.gamersky.com/news/Content-2041114.html)
- [CEDEC Awards 2026 官方公告](https://www.gamespress.com/ja-JP/MIMESIS-WINS-EXCELLENCE-AWARD-IN-GAME-DESIGN-AT-JAPANS-CEDEC-AWARDS-20)
- [Steam评测分析 (日文)](https://sarusarugame.blog/mimesis-gekikara-review-naze-teihyoka-review/)
- [MIMESIS TOS - AI条款](https://www.relugames.com/mms/tos/en)
- [Thunderstore ItemsAPI反编译](https://thunderstore.io/c/mimesis/p/Shlygly/ItemsAPI/source/)
