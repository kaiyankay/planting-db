# Workflow V5 — 流程图

对应 [WORKFLOW-V5.md](WORKFLOW-V5.md)。图用 Mermaid 写成，在 GitHub 上直接显示。
实线 = 数据向下传递；虚线 = 回馈到前面的步骤。

## 1. 主流程与回馈

```mermaid
flowchart TD
  subgraph IMAGINE["Imagine"]
    S1["S1 Evidence Intake<br/>text · photo · plan · address · sketch · heightmap"]
    S2["S2 AI Site Interpretation<br/>readers → observations → fusion<br/>→ Site Hypothesis + questions"]
  end
  subgraph SHAPE["Shape"]
    S3["S3 Site Model + Site Analysis<br/>boundary · terrain · features · conditions<br/>→ fields → plantable → site units"]
  end
  subgraph DESIGN["Planting Design"]
    S4["S4 Design Intent<br/>goals → spatial intents<br/>(where · viewpoints · height · coverage)"]
    S5["S5 Planting Strategy<br/>system → structure plan<br/>→ areas (bed geometry) + layers"]
    S6["S6 Planting Composition<br/>planting volumes<br/>2D ⇄ 3D → plant objects"]
  end
  subgraph GROW["Grow"]
    S7["S7 Evaluation · Trace · Output"]
  end
  DB[("Plant knowledge<br/>claims · gates · function links")]

  S1 -->|"sources"| S2
  S2 -->|"confirmed hypothesis"| S3
  S3 -->|"site units · fields"| S4
  S3 -->|"site units · fields"| S5
  S4 -->|"spatial intents"| S5
  S5 -->|"areas · layers · height bands"| S6
  S6 -->|"DesignVersion"| S7
  DB -->|"role coverage"| S5
  DB -->|"species per role · sizes"| S6

  S2 -.->|"ask for a source / a known length"| S1
  S3 -.->|"user edit overrides an observation"| S2
  S6 -.->|"an unknown condition decides the result"| S2
  S5 -.->|"propose a change to an editable site element"| S3
  S7 -.->|"intent cannot be met here"| S4
  S5 -.->|"intents conflict"| S4
  S6 -.->|"depth too small · role unfilled · 3D check fails<br/>→ adjustment options"| S5
  S7 -.->|"not met / uncertain, with a destination"| S5
  S7 -.->|"composition change"| S6
  S7 -.->|"missing facet or species"| DB
```

## 2. 谁做什么

```mermaid
flowchart LR
  subgraph AI["AI — reads, proposes, asks, explains"]
    A1["read text and images"]
    A2["propose a site hypothesis"]
    A3["rank open questions"]
    A4["expand vague goals into intents"]
    A5["rank and explain adjustment options"]
    A6["turn words into previewed edits"]
  end
  subgraph DET["Deterministic algorithms — compute"]
    D1["schema check · units · scale"]
    D2["terrain grid · slope · contours"]
    D3["condition fields · site units"]
    D4["structure operators · bed geometry"]
    D5["role qualification from claims"]
    D6["placement · spacing · 2D and 3D checks"]
    D7["evaluation · trace · versions"]
  end
  subgraph USER["Designer — decides"]
    U1["confirm or correct the site"]
    U2["priorities · viewpoints"]
    U3["choose system · accept an adjustment"]
    U4["composition · layers · species mix"]
    U5["accept a version"]
  end
  A1 --> D1
  A2 --> U1
  D1 --> D2 --> D3
  A4 --> U2
  D3 --> D4
  U2 --> D4
  D4 --> A5 --> U3
  U3 --> D5 --> D6
  A6 --> D6
  U4 --> D6
  D6 --> D7 --> U5
```

AI 的任何输出在进入模型之前都经过 D1 的校验，或经过用户确认。AI 不写米制几何，不选物种，不落点，不改评价数值。

## 3. 现状与 V5 的顺序差别

```mermaid
flowchart LR
  subgraph NOW["现在"]
    n1["Intent"] --> n2["Bed geometry<br/>(Shape)"] --> n3["System<br/>(per-bed option)"] --> n4["Species"] --> n5["2D arrangement"] --> n6["3D display"]
  end
  subgraph V5["V5"]
    v1["Intent"] --> v2["System"] --> v3["Bed geometry<br/>+ layers + height bands"] --> v4["Species"] --> v5["2D ⇄ 3D composition"]
    v5 -.-> v3
    v4 -.-> v2
    v5 -.-> v1
  end
```

## 4. 证据等级的流动

```mermaid
flowchart LR
  M["measured"] --> F["fusion<br/>conflicts shown"]
  ST["stated"] --> F
  INF["ai-inferred"] --> F
  C["conceptual"] --> F
  AS["assumed"] --> F
  UN["unknown"] --> Q["open questions<br/>ranked by impact"]
  F --> H["Site Hypothesis"]
  Q --> H
  H -->|"user confirms / corrects"| SM["Site Model<br/>every value keeps its class"]
  INF -. "never becomes" .-> M
  UN -. "never silently filled" .-> AS
```
