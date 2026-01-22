# Elypink Theme

A theme addon for Visual Studio Code (and compatible software).

![Elypink Light](images/elypink-light.png)

![Elypink Dark](images/elypink-dark.png)

## Theme List

### Light

- Elypink Light — Pink base theme
- Elypink Light Subtle — 20% reduced saturation
- Qinshi Light — Auspicious cyan for hackers

### Dark

- Elypink Dark — Pink dark theme
- Elypink Dark Subtle — 20% reduced saturation dark
- Qinshi Dark — Auspicious cyan for hackers, dark


## Scripts

All themes are generated from a single source file `themes/elypink-light.json` using color transformation scripts.

``` mermaid
flowchart LR
    L["Elypink Light"] -->|"dark"| D["Elypink Dark"]

    L -->|"subtle"| LS["Elypink Light Subtle"]
    L -->|"qinshi"| LQ["Qinshi Light"]

    D -->|"subtle"| DS["Elypink Dark Subtle"]
    D -->|"qinshi"| DQ["Qinshi Dark"]

    style L fill:#F9EBF2,stroke:#B25A7F,color:#5A4751
    style D fill:#373134,stroke:#E85392,color:#CD95B3
    style LS fill:#F9EEF3,stroke:#B26C89,color:#5A4B53
    style LQ fill:#D7DDE0,stroke:#6989A0,color:#454D51
    style DS fill:#373235,stroke:#E871A3,color:#CDA0B8
    style DQ fill:#2E3032,stroke:#73AAD1,color:#95AEB9
```

``` bash
# Execution order
node scripts/generate-dark.js
node scripts/generate-qinshi.js
node scripts/generate-subtle.js
```


## License

MIT
