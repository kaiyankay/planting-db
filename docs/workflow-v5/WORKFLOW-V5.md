# Planting Intelligence — Workflow V5（架构提案）

2026-11-23 · 分支 `docs/workflow-v5`（基于 `feature/topography-presets` ee9bcfb）· **本轮没有修改任何代码**。
这是一份待确认的逻辑架构，不是 UI 方案，也不是实现计划。流程图见 [WORKFLOW-V5-flow.md](WORKFLOW-V5-flow.md)。

依据：现有源码（`design/js/*`、`tools/design_server.py`、`platform/js/trace.js`）与 *Generative Planting at Scale*（Rainer / Liu / Landau, 2024，下称 PPT）。PPT 只作为方法参考，不提供任何植物参数。

---

## 0. 结论

现有流程是一条**单向装配线**：文字 → 场地矩形 → 种植床 → 功能 → 排列 → 3D 显示。每一步把上一步的结果当作固定前提。
V5 把它改成**五个互相约束的模型**，每个模型都有明确的输入、输出、证据等级和回馈路径：

```
Evidence ─▶ Site Interpretation ─▶ Site Model + Site Analysis ─▶ Design Intent
                                                                      │
              Evaluation + Trace ◀── Planting Composition (2D ⇄ 3D) ◀── Planting Strategy
                     └────────── 冲突 → 调整方案 → 回到 Strategy / Intent / Site ──────────┘
```

三个最重要的结构变化：

1. **种植床不再是 Shape 的产物。** Site Model 只给出"哪里可以种、条件如何"（plantable zones / site units）；床的几何由 Planting Strategy 根据 system 的空间要求生成。
2. **植物不再是"2D 点 + 事后拉高"。** 构图的基本对象是带高度带的 planting volume，2D 与 3D 编辑同一个对象。
3. **AI 只负责读取、提出假设、提问和解释。** 米制几何、分析、资格判断、落点和评价全部由确定性算法完成；植物事实只来自数据库。

---

## 1. 现有流程的结构性问题（代码审查）

| # | 问题 | 代码中的事实 |
|---|---|---|
| P1 | **Interpretation 太窄，且只在入口发生一次** | `intent.js` 是离线正则规则，只读文字；`design_server.py /api/interpret` 能接 live model，但从未用真实模型验证过。照片只是描图底图（"never recognised automatically"）；地址只得到一个地图位置（`geocode.js`）；平面图、手绘没有读取路径；heightmap 是进入 Shape 之后的手动工具（`terrainui.js`）。 |
| P2 | **不同来源没有统一的证据模型** | condition 有 `{value, status, source}`，terrain 有自己的 `status/provenance`，feature 有 `status`，concept sketch 又是一套。没有"同一事实的多个观察"与冲突处理。 |
| P3 | **Site Model 不是完整的场地** | 光照、土壤、水是全场地各一个值；树冠下的光只是"床面积 ≥ 50 % 在冠下"的启发式（`engine.bedConditions`）；plantable area 只是几何减法（`spatial.deriveSite`），不含条件。没有 site units。 |
| P4 | **床先于策略** | `spatial.propose()` 在 Shape 阶段就用 edge band / island / infill 生成床（Screen 带宽固定 1.2 m），此时还没有 planting system。之后 system 只能在既定床里填角色。 |
| P5 | **Preset 是床内选项** | `bed.composition.system` 与 pattern / rows 同级。system 与床不合时只能报告 `not met` / `unresolved`（如 Woodland Edge 放在 North bed），不能提出改床。唯一的例外是 `boundary.js` 里针对 Screen 行深的 "depth offer"。 |
| P6 | **3D 是 2D 的投影** | engine 只在平面上落点；高度只在 `heightAgainst()` 里与一个目标数字比较。没有视点、视线、围合、冠下净空；地形只通过 slope gate 影响"能不能种"。`garden3d.js` 是只读的透视渲染。 |
| P7 | **回馈只有"过期"标记** | 上游变化 → 下游标 stale、重新生成。下游发现的问题（床太浅、角色空缺、条件未知）不会变成上游的修改建议。 |
| P8 | **条件未知时仍然继续** | 水、土壤未知时 gate 返回 `unknown`，流程照常生成，只在评价里说明。没有"哪个未知最值得先问"的机制。 |

---

## 2. 证据等级（贯穿全流程）

每个事实都是一条 **observation**：`{ value, class, source, method, confidence_note, confirmed_by_user }`。同一事实可以有多条。

| class | 含义 | 例 | 能否升级 |
|---|---|---|---|
| `measured` | 带单位、带来源的测量数据 | 测绘图上的标高、DEM、带比例尺的平面图 | — |
| `stated` | 用户明确说出或输入 | "8 × 5 m""part shade" | 不会自动变成 measured |
| `ai-inferred` | 模型从图像或文字推断 | 照片里"东侧有一棵树""地面似乎向南倾斜" | 用户确认后变 `stated (confirmed inference)`，来源仍记为推断 |
| `conceptual` | 用户选定的概念形态 | gentle slope、berm、手绘 heightmap | 永远不是测量 |
| `assumed` | 系统为继续计算而设的默认值 | 树冠半径 1.5 m | 必须在界面与版本里标出 |
| `unknown` | 没有信息 | 土壤、排水 | 不得被默认值悄悄填掉 |

规则：
- **AI 推断永远不会成为 `measured`。** 没有比例或单位的来源不产生米制数值。
- 冲突时优先级 `measured > stated > ai-inferred > conceptual > assumed`，但**冲突本身要显示**，由用户裁决。
- 下游每个决定记录它依赖了哪些 observation；observation 改变时，只有依赖它的决定失效。

这与 PPT p.16–17 的警告一致：自动化超出理解就会失控；p.110、p.135 区分 rule-based（可预测、可控）与 generative（不可预测）。V5 把后者限制在"读取与提议"。

---

## 3. 流程：七个步骤

### S1 · Evidence Intake（Imagine）

| | |
|---|---|
| **Input** | 自然语言、场地照片、平面图/测绘图、地址、手绘草图、heightmap；可多个，可后补 |
| **Processing** | 只做登记与分类：每个输入成为一个 `source`，记录类型、文件、时间、用户说它是什么 |
| **Output** | `sources[]` |
| **AI** | 判断来源类型并向用户确认（"这是照片还是平面图？"），不解读内容 |
| **确定性算法** | 文件校验；像素统计（彩色/灰度）；EXIF 读取 |
| **用户决定** | 提供什么；每个来源代表什么 |
| **→ 下一步** | `sources[]` → S2 |
| **← 回馈** | S2–S6 提出的问题可以要求补充来源（"请给一个已知长度""有没有带标高的图"） |

### S2 · AI Site Interpretation

这是 Imagine → Shape 的桥。每种来源有自己的 reader，输出同一种 observation。

| 来源 | 读取方式 | 能得到什么 | 最高证据等级 | 现状 |
|---|---|---|---|---|
| 自然语言 | 语言模型 + 离线规则兜底 | 尺寸、方位关系、既有物、条件词、目标、**地形词**（"向南坡下""有一处低洼"） | `stated`；地形词 → `conceptual` 形态 + 参数 | 离线规则已有；地形词未读；live model 未验证 |
| 场地照片 | 视觉模型 | 有哪些物体、地表类型、明显的坡向/台地（定性）、遮挡物 | `ai-inferred`；**无尺寸、无高程** | 未实现 |
| 平面图 / 测绘图 | 视觉模型 + 用户标定比例 | 边界形状、既有物位置、等高线与标高 | 有比例且标高可读并经用户确认 → `measured`；否则 `ai-inferred` | 未实现（现在只能手动描） |
| 地址 | 地理编码 → 公开数据 | 位置、朝向/日照几何、气候带；地块轮廓与 DEM **视数据可得性** | 数据集本身是 `measured`，但须注明分辨率（庭院尺度下 DEM 可能只有几个像素） | 只有地理编码；其余未实现，数据源待核实 |
| 手绘草图 | 视觉模型 | 拓扑与相对位置（无单位） | `ai-inferred` → 概念草图 | `concept.js` 已有目标结构，但只能由文字生成 |
| Heightmap | 确定性读取 | 相对高程；给出高程范围后为米制 | `conceptual`；仅地理配准的高程栅格为 `measured` | 已有（`terrain.fromImage`），但不在 interpretation 内 |

| | |
|---|---|
| **Input** | `sources[]` |
| **Processing** | ① 各 reader 产生 observations；② **融合**：同一事实的多条观察对齐、检出冲突；③ 生成 **Site Hypothesis**（一个完整但带标注的场地草案）；④ 生成按影响排序的问题清单 |
| **Output** | `SiteHypothesis { boundary, terrain, features, conditions, 每项的 observations 与冲突 }` + `open_questions[]` |
| **AI** | 读图读文字；提出假设；写出它不确定什么；把问题按"对后续设计影响多大"排序 |
| **确定性算法** | schema 校验（AI 输出必须符合观察格式，否则拒收）；单位与比例换算；冲突检测；地形由形态参数或栅格生成（`terrain.js`）；任何没有比例的观察不得进入米制几何 |
| **用户决定** | 逐项确认 / 修改 / 拒绝；裁决冲突；决定哪些未知先留着 |
| **→ 下一步** | 确认后的 hypothesis → S3 的 Site Model |
| **← 回馈** | S3 编辑场地后，被改动的 observation 标为"用户覆盖"；S5/S6 发现某个未知条件正在决定结果时，回到这里提问 |

**Topography 在这一步进入**：文字里的地形词、照片里的定性坡向、图纸上的等高线、地址的 DEM、上传的 heightmap，全部是 terrain 的 observations，融合成一个带等级的地形。`terrainui.js` 的手动工具降为"编辑与补充"，不再是唯一入口。

### S3 · Site Model + Site Analysis（Shape）

| | |
|---|---|
| **Input** | 已确认的 Site Hypothesis |
| **Processing** | **模型层**（可编辑）：boundary · terrain · existing features（树、构筑物、铺装、禁种区）· conditions。**分析层**（只读、由模型算出）：slope、aspect、elevation、冠下范围、与边界/构筑物的距离、可种范围 → 叠合成 **site units** |
| **Output** | `SiteModel` + `SiteAnalysis { fields{}, plantable, site_units[] }`。每个 site unit = 一片条件相近的可种地：`{ polygon, light, slope_class, under_canopy, proximity, 各项的证据等级 }` |
| **AI** | 解释分析结果；把用户的文字修改翻译成模型编辑（预览后才应用）。不计算任何场 |
| **确定性算法** | 全部分析。坡度、等高线、可种面积已有；光照场、proximity、site units 为新增。**不从地形推排水或湿度**；阴影场需要日照几何，在没有纬度和遮挡高度时只标"未计算" |
| **用户决定** | 确认/修改模型；哪些分析层参与设计（例如是否启用 slope 限制）；阈值 |
| **→ 下一步** | `site_units[]` 与 `fields` → S4、S5 |
| **← 回馈** | S5 可请求"这里的条件需要确认"；S6 的调整方案可提议改 Site Model 中**可改的**部分（如移除一块铺装），但不能改既有事实（树的位置） |

**表达方式：axonometric site diagram。** 参考 PPT p.69（Topo / Site / Paving / Planting / Performance 的轴测叠层）、p.72（Plants · Slope · Sun Exposure · Elevation · Proximity 分层约束）、p.15（自动化场地分析的地形图）、p.127–131（地形体块与等高线）。
这不是换一个相机角度。它的逻辑含义是：**每一个分析场都是轴测图中的一层，层与数据一一对应**——地形体块带剖切边缘与等高线、既有物、可种范围、各分析层可分开上提。平面图（2D）保留，用于精确编辑；现有透视 3D 保留给 Grow 的成果表达。

### S4 · Design Intent

| | |
|---|---|
| **Input** | 用户目标（文字 + 选择）、Site Model、Site Analysis |
| **Processing** | 目标 → **有位置的空间意图**：Screen 不再只是"北侧边缘 + 目标高度"，而是"从视点 A 看向 B 的视线需要被挡住"；Open 是一片要保持的范围与高度上限；Ground Cover 是一片要覆盖的地 |
| **Output** | `Intent { goals[], spatial_intents[]: { function, where(几何), viewpoints?, height/visibility 要求, priority }, constraints[] }` |
| **AI** | 把模糊目标（"想要私密但不要封闭"）展开成几个可选的空间意图，并指出其中的矛盾 |
| **确定性算法** | 可行性预检：该意图所在的 site units 是否有可种地、是否有任何物种可能满足（数据库层面的 coverage 检查，现有 `presets.coverage` 的做法） |
| **用户决定** | 目标优先级；视点位置；哪些是硬约束 |
| **→ 下一步** | `spatial_intents[]` → S5 |
| **← 回馈** | S6 报告某个意图在现有场地与数据库下无法满足时，回到这里降低要求或调整优先级 |

### S5 · Planting Strategy（system → 空间结构 → 床）

这一步是 V5 新增的核心，把现在分散在 `spatial.js`（床）与 `presets.js`（角色）的内容合并并倒转顺序。

| | |
|---|---|
| **Input** | `site_units[]`、`spatial_intents[]`、system 目录、数据库的角色 coverage |
| **Processing** | ① 对每个意图 + 场地单元，列出适用的 systems（现有 `applicability` + `coverage`）；② 每个 system 声明自己的**空间要求**（每层最小进深、所需条件、结构类型：edge / gradient / matrix / mosaic）；③ 由 system 的结构算子生成 **structure plan**：种植范围、分层带、各层的高度带；④ 检出冲突并生成调整方案 |
| **Output** | `StrategyPlan { areas[]: { geometry, system, layers[]: { role, zone geometry, height_band, 资格要求 } }, conflicts[], adjustment_options[] }`。**床的几何在这里产生** |
| **AI** | 说明每个 system 为什么适用/不适用；对调整方案排序并解释取舍。不生成几何 |
| **确定性算法** | 结构算子（现有 `opEdgeBand / opIsland / opRibbon / opInfill`、`zone_by_canopy`）；进深与面积计算（现有 `rowPlan` 已能算"第二排需要多少进深"）；冲突检测 |
| **用户决定** | 选 system；接受哪一个调整方案；手动改范围 |
| **→ 下一步** | `areas[]` + `layers[]` → S6 |
| **← 回馈** | S6：角色无物种可填、落点不足、3D 检查不过 → 回到这里重新生成调整方案 |

**冲突与调整方案**（现在只会报 `not met`）。每个冲突产生一组确定性算出的选项，各带后果：

| 冲突 | 选项（示例） |
|---|---|
| system 需要的进深 > 可用进深 | A 加深范围 +x m（占用 y m² 开敞地）· B 减层（单排）· C 换 system |
| 必需角色无合格物种 | A 该层留空并说明 · B 放宽该角色的某项要求（列出是哪项、会放进谁）· C 换 system · D 标记为数据库缺口 |
| 意图互相矛盾（遮挡 vs 开敞） | A 降低遮挡高度 · B 缩短遮挡段 · C 改用通透层（需要 Scrim 的排列规则，尚无） |
| 关键条件未知 | A 先问用户 · B 按两种情况各算一版并排比较 |
| 陡坡使范围不可种 | A 调整范围避开 · B 提高阈值（标明是启发式）· C 接受缺口 |

### S6 · Planting Composition（2D ⇄ 3D）

| | |
|---|---|
| **Input** | `StrategyPlan`、数据库、terrain |
| **Processing** | 基本对象是 **planting volume**：`{ footprint, layer role, height_band, density, porosity }`。2D 与 3D 是同一组对象的两种编辑方式，约束联合求解，再由物种选择与排列落实为 plant objects |
| **Output** | `DesignVersion { volumes[], plant_objects[], groups, checks_2d, checks_3d }` |
| **AI** | 把文字修改翻译成对 volume 的操作；解释检查结果。不选物种、不落点 |
| **确定性算法** | 角色资格（`presets.qualify`）；排列算子（`engine.js`）；2D 检查：连续性、覆盖率、间距、缺口（已有）；3D 检查：见下表 |
| **用户决定** | 构图：范围形状、pattern、疏密；分层：层序、高度带、围合程度；物种 mix；接受哪些不确定 |
| **→ 下一步** | `DesignVersion` → S7 |
| **← 回馈** | 到 S5：需要更深/更多层/不同 system；到 S4：意图不可满足；到 S2/S3：某个未知或假设在决定结果 |

**2D 与 3D 各自负责什么，如何互相影响：**

| | 2D | 3D |
|---|---|---|
| 负责 | spatial composition、planting masses、patterns、spacing、coverage | vertical layers、height、enclosure、visibility、canopy relationship、terrain relationship |
| 编辑 | footprint、pattern、density、mix | 层序、height band、视点、剖切线 |
| 检查 | 连续性、覆盖率、间距、缺口 | 视线剖面（地面高程 + 植物高度 对 视线）、围合比、层间高差、冠下净空、坡上落点 |

互相影响的例子（都是同一约束的两面）：
- 3D → 2D：视线要求某段的顶高 ≥ h。地形在那里低 0.4 m → 需要更高的结构层 → 合格物种更少、冠幅更大 → 需要更大的进深 → 2D 范围要加深，或回 S5。
- 2D → 3D：范围只有 1.2 m 深 → 只容一排 → 3D 剖面只有一层结构 + 脚下地被 → 围合程度的上限由此确定。
- 3D → 2D：既有树冠下 → 冠下高度带受限 → 该 footprint 只能放低层角色。
- 2D → 3D：选 patches（留空地）→ 3D 的围合出现缺口 → 视线检查按实际 footprint 计算，不按"整床"。

**诚实的边界：** 高度来自数据库的 claimed mature range，所以 3D 检查是"在声称的成熟尺寸下的几何估计"，不是可见度模拟；既有树的冠底高度、树种、枝叶密度数据库与场地模型都没有 → 冠下净空现在只能报 `unknown`。

### S7 · Evaluation · Trace · Output（Grow）

| | |
|---|---|
| **Input** | `DesignVersion`、Site Model、Intent、StrategyPlan |
| **Processing** | 逐条意图评价（met / uncertain / not met + 原因）；每株的因果链（site → analysis → intent → system role → species claims → placement）；把"原因"归类成指向上游某一步的回馈 |
| **Output** | `Evaluation`、trace、Plan · Algorithm · Presentation · 3D · schedule · export |
| **AI** | 把评价写成设计师能读的话；按影响排序下一步建议。不改评价数值 |
| **确定性算法** | 全部度量；trace（现有 `presets.chain`、`trace.js`）；版本指纹与失效 |
| **用户决定** | 接受版本；选择回到哪一步修改；导出 |
| **← 回馈** | 每条 `not met` / `uncertain` / `unknown` 都带一个去向：S2（缺证据）· S3（场地）· S4（意图）· S5（策略/几何）· S6（构图）· 数据库（缺 facet / 缺物种） |

---

## 4. 六者之间的关系（回答第 4 点）

```
Site Conditions ──限定──▶ 哪些 Intent 可行、哪些 System 适用、哪些 Species 合格
Design Intent  ──要求──▶ 在哪里、达到什么（位置 + 高度/可见性 + 覆盖）
Planting System ─决定──▶ 需要哪些层、每层要什么条件与进深、用什么结构
        │
        ▼ 生成
Bed Geometry（范围 + 分层带）──限定──▶ 每层可用面积与进深
        │
        ▼
Species Selection（按角色，从数据库）──给出──▶ 冠幅、高度范围
        │
        ▼
Arrangement（间距 = 冠幅的函数）──▶ 落点、数量、覆盖、连续性
```

向上的回馈：
- Arrangement → Bed Geometry：冠幅决定的行深/间距放不下。
- Species → System：角色无人可填。
- Species → Site Conditions：某个未知条件决定了谁合格。
- Bed Geometry → Intent：满足遮挡所需的范围与"保持开敞"冲突。
- Arrangement / 3D → Intent：在声称尺寸下达不到目标高度或可见性。

现状与 V5 的差别只有一处顺序，但影响全局：**现在是 Intent → Bed Geometry → System；V5 是 Intent → System → Bed Geometry。**

---

## 5. 模块去留

| 模块 | 判断 | 说明 |
|---|---|---|
| `knowledge.js`、数据库、evidence 链 | **保留** | 植物事实的唯一来源；不改 |
| `geom.js`、`clip.js` | 保留 | |
| `terrain.js` | 保留，接口上移 | 成为 S2 的地形输出格式；`fromDem` 是 measured 的唯一入口 |
| `engine.js` 排列算子、`placeable`、`rowPlan`、evaluate | 保留为 S6 的 2D 部分 | 需要接收 volume 与高度带；增加 3D 检查 |
| `presets.js` 的 layers / qualify / coverage / chain | 保留，**上移到 S5** | 增加"空间要求"与结构算子的声明；不再挂在 `bed.composition` 下 |
| `spatial.js` 的 op* 算子、`bedEditPreview` | 保留算子，**重构调用方** | 从"Shape 里按 function 提床"改为"S5 里由 system 调用" |
| `spatial.propose()`、Shape 中的 bed proposal | **重构** | Shape 只产生 plantable zones 与 site units |
| `model.js` | **重构** | 增加 sources / observations、SiteAnalysis、Intent 几何、StrategyPlan、volumes；版本与指纹机制保留 |
| `intent.js` | 保留为离线兜底，**扩展** | 增加地形词；输出改为 observation 格式 |
| `design_server.py /api/interpret` | 重构 | 多模态 readers、schema 校验；须用真实模型验证 |
| `concept.js` | 保留并泛化 | 成为"无比例假设"的通用表示，手绘与照片也进入 |
| `geocode.js` | 保留，扩展 | 地址 → 日照几何、公开数据（待核实来源） |
| `terrainui.js`、`boundary.js` | 保留为 S3 的编辑工具 | 不再是地形的唯一入口 |
| `garden3d.js` | 保留给 Grow；**新增** axonometric site diagram | 现有透视相机与植物造型不适合做分析图 |
| `systemui.js` 的 Compose 条 | 重构 | system 的选择移到床之前 |
| `trace.js`、`algoview.js`、`render.js` | 保留 | trace 增加 S2/S5 的环节 |
| 测试与回放机制 | 保留 | 每一步的输出对象都应有可回放的检查 |

**尚未实现的能力：**

- 照片 / 平面图 / 手绘的视觉读取；真实语言模型下的解读质量（从未在有 API key 的环境中跑过）
- 多来源融合与冲突裁决；按影响排序的提问
- 地址 → 地块、DEM、日照；数据可得性与分辨率未核实
- 空间化的条件场（光照、proximity）与 site units
- 有位置的意图（视点、视线、开敞范围）
- system 驱动的床几何；冲突 → 调整方案
- planting volume；视线剖面、围合、冠下净空等 3D 检查
- axonometric site diagram
- Scrim / Canopy / Barrier 的排列规则（至今 recorded only）；新栽乔木的落位规则
- 数据库缺口：phenology、longevity、禾草类、扩展方式、坡度相关的记录、既有树的属性

---

## 6. 需要你先确认的问题

1. **床的归属**：同意"Shape 不再提床，床由 Planting Strategy 生成"吗？这会改变现在 Shape 页的主要内容。
2. **Site units 的粒度**：按哪些场划分——光照、坡度、冠下、距边界？全部叠合，还是由设计师选择参与的层？
3. **意图的表达**：Screen 用"视点 → 目标"的视线定义，还是继续用"边缘 + 目标高度"？前者才能让地形和 3D 真正参与。
4. **AI 的权限**：AI 推断的边界形状（来自照片或手绘）可以直接成为可编辑的草案吗？还是必须先有一个已知长度？
5. **未知条件**：关键条件未知时，是停下来问，还是并排给出两种情况的方案？
6. **调整方案的范围**：系统可以提议改用户已确认的床/范围吗？可以提议降低用户的目标吗？
7. **Axonometric**：作为 Shape 的主视图（平面为辅），还是与平面并列？分层上提（exploded）是否必须？
8. **第一个要验证的闭环**：建议先做 `S5 → S6 → S5` 的回馈（system 需要的进深不够 → 给出调整方案），因为所需算法大部分已存在。同意吗？
9. **地址数据**：是否接受接入外部公开数据服务？这会带来网络依赖和数据授权问题。

---

## 7. 本文没有做的事

- 没有修改代码，没有运行新的实验。对现有代码的描述来自本轮与上一轮的阅读。
- 视觉模型能从庭院照片里可靠读出什么，这里只是职责划分，**不是能力声明**，需要实测。
- 外部数据源（地块、DEM）只写了"视可得性"，没有核实任何具体服务。
- 没有给出 UI layout、工期或实现顺序。
