# Research sweep "whatif" — If THE LINE had actually been built as promised

Compiled 2026-09-27 for the video *"사우디의 네온 시티, 진짜로 지어졌다면?"*.
Method: 40+ WebSearch queries (EN + KO). Direct page fetches (WebFetch) were blocked by the session's egress proxy for every host tried (Wikipedia, Nature, Dezeen, phys.org, CSH, Our World in Data, index.go.kr, businesspost.co.kr, worldometers), so each sourced fact below comes from the search-engine extract of the named page. Re-verify before air.

Labels: **[SOURCED]** = number taken from the cited page. **[COMPUTED]** = derived by us from sourced inputs (script: haversine distance, simple arithmetic, solar geometry). Assumptions are stated inline.

Korean on-screen phrasing to reuse: 더 라인(더라인), 네옴시티, 인구밀도 1㎢당 26만 명, 서울 면적의 6%, 여의도 12배, 서울~강릉 직선거리, 롯데월드타워, 거울 외벽 170㎢, 더 스파인(고속철), 유령도시(송도·마스다르·포레스트시티), 외국인 노동자, 계획인구.

---

## 0. The promise (baseline inputs)

| Spec | Value | Source |
|---|---|---|
| Length / height / width | 170 km / 500 m / 200 m; two parallel mirrored walls | [whatisneom.com explainer](https://whatisneom.com/en-us/articles/the-line-neom-explained/); [learnarchitecture.net guide](https://learnarchitecture.net/articles/32570-neom-the-line-a-complete-guide-to-the-170km-linear-city-in-the-desert.html) **[SOURCED]** |
| Residents / footprint | 9,000,000 people on 34 km²; car-free; 100 % renewable; end-to-end in 20 min | same as above; [ko.wikipedia 더 라인](https://ko.wikipedia.org/wiki/%EB%8D%94_%EB%9D%BC%EC%9D%B8_(%EC%82%AC%EC%9A%B0%EB%94%94%EC%95%84%EB%9D%BC%EB%B9%84%EC%95%84)) — "서울 면적의 6%에 서울과 같은 900만 명 수용, 자연 95% 보존" **[SOURCED]** |
| Modules | 135 modules × 800 m, each up to 80,000 people; 5-min walk to amenities, 2-min to nature | [Arab Urban Development Institute project page](https://araburban.org/en/infohub/projects/?id=3700) **[SOURCED]** |
| Module cross-check | 135 × 800 m = **108 km** (not 170 km); 135 × 80,000 = **10.8 M** capacity; one module footprint 0.16 km² → **500,000 people/km²** | **[COMPUTED]** — the official module numbers do not tile to 170 km; flag as inconsistency |
| Rail ("THE SPINE") | high-speed trains "more than 500 km/h", 20 min end-to-end | [Hotelier Middle East](https://www.hoteliermiddleeast.com/saudi-arabia/neom-the-line-the-spine); [Arabian Business](https://www.arabianbusiness.com/industries/construction/the-line-saudi) **[SOURCED]** |

---

## 1. Density — 9 M people on 34 km²

- **9,000,000 / 34 km² = 264,706 people/km²** **[COMPUTED]**
- Seoul: **15,550/km² (2022)** — [서울 열린데이터광장 / 정보소통광장](https://opengov.seoul.go.kr/data/view/?nid=10565495); indicator page [e-나라지표 1007](https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1007) **[SOURCED]** → THE LINE = **17×** Seoul **[COMPUTED]**
- Manhattan: **1,694,251 people on 58.7 km² = 28,872/km² (2020 census)** — [Wikipedia: Demographics of Manhattan](https://en.wikipedia.org/wiki/Demographics_of_Manhattan) **[SOURCED]** → **9.2–9.4×** Manhattan **[COMPUTED]**
- Dharavi (Mumbai): ~1,000,000 on ~2.39 km²; density cited between **~270,000/km² and 418,410/km²** — [Wikipedia: Dharavi](https://en.wikipedia.org/wiki/Dharavi); [PMC7832248 (2021)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7832248/) **[SOURCED]** → THE LINE ≈ Dharavi's low estimate (0.6–1.0×) **[COMPUTED]**
- Kowloon Walled City: **33,000 people on 2.6 ha (1987) ≈ 1,255,000/km²**; peak estimate **~50,000 (1990) ≈ 1.9 M/km²** — [Wikipedia: Kowloon Walled City](https://en.wikipedia.org/wiki/Kowloon_Walled_City); [HowStuffWorks](https://history.howstuffworks.com/world-history/kowloon-walled-city.htm); [Everything Everywhere](https://everything-everywhere.com/the-walled-city-of-kowloon/) **[SOURCED]** → THE LINE = **1/5 to 1/7** of Kowloon **[COMPUTED]**
- Sanity check on floor area: 34 km² footprint × ~60 usable floors (assumption) ≈ 2,040 km² GFA ≈ **227 m² gross per resident** — the density is only "livable" because it is stacked 500 m high **[COMPUTED, assumption-heavy]**

## 2. Length — what is 170 km to a Korean viewer?

- **Seoul City Hall → Gangneung City Hall straight line = 168.4 km** (haversine) **[COMPUTED]**; independently tabulated as "약 168km" in [서울에서 주요 지역 직선 거리표 (arca.live, 시청 기준)](https://arca.live/b/city/34950861) **[SOURCED, low-authority]**
- **Seoul → Daejeon straight line = 140.0 km** **[COMPUTED]**; road distance Seoul–Daejeon ~160 km, Seoul–Gangneung ~212–234 km — [korea2me](https://www.korea2me.com/distance/1604566-1603654); [rome2rio](https://www.rome2rio.com/ko/s/%EC%84%9C%EC%9A%B8/%EA%B0%95%EB%A6%89%EC%8B%9C) **[SOURCED]**
- Seoul → Busan straight line = 325 km (THE LINE ≈ half) **[COMPUTED]**
- Korean media framing already in use: "네옴 더 라인의 길이는 **서울에서 강릉, 대구에서 광주까지의 거리**이며, 서울 **롯데타워 높이의 판상형 2개 건물 연속**" — [매일신문, 최상대의 건축인문기행, 2024-10-31](https://www.imaeil.com/page/view/2024103118145562211) **[SOURCED]**
- KTX Seoul–Gangneung takes ~1h40–2h — [강릉뉴스](https://www.gangneungnews.kr/news/articleView.html?idxno=58029) **[SOURCED]**; THE LINE promised the same distance in 20 min.

## 3. Height — 500 m

- Lotte World Tower **555 m, 123 floors**; Burj Khalifa **828 m**; Empire State Building **~443 m** (442 m architectural) — [Britannica tallest buildings](https://www.britannica.com/topic/tallest-buildings-in-the-world-2226971); [더구루 '555미터' 롯데월드타워](https://www.theguru.co.kr/news/article.html?no=54589) **[SOURCED]**
- THE LINE's wall = **55 m shorter than Lotte World Tower, 57 m taller than the Empire State**, and it runs unbroken for 170 km on both sides **[COMPUTED]**

## 4. The mirror — facade area & cleaning

- Facade: 2 walls × 170,000 m × 500 m = **170,000,000 m² = 170 km²** **[COMPUTED]** (outer faces only; interior canyon faces would double it)
- 170 km² = **28 % of Seoul's land area (605.2 km²)** = **~59 여의도 (2.9 km² standard)**; the 34 km² footprint = **5.6 % of Seoul ≈ 12 여의도** — Seoul/Yeouido areas from [헤럴드경제, 국토부 여의도 기준 2.9㎢](https://mbiz.heraldcorp.com/article/10214651); [atlasnews](http://www.atlasnews.co.kr/news/curationView.html?idxno=6254) **[SOURCED inputs, COMPUTED ratios]**
- Burj Khalifa has **24,000 panels ≈ 120,000 m² of glass; 36 cleaners take 3 months per full wash** — [Gulf News "Tall order for Burj Khalifa cleaning crew"](https://gulfnews.com/business/property/tall-order-for-burj-khalifa-cleaning-crew-1.561803); [The National](https://www.thenationalnews.com/arts-culture/television/richard-hammond-s-big-did-you-know-burj-khalifa-takes-120-window-cleaners-three-months-to-wash-1.994587) **[SOURCED]**
- THE LINE's mirror = **~1,417 Burj Khalifas of glass**; at Burj productivity (13,333 m² per cleaner-year) it takes **~12,750 full-time cleaners to wash it once a year, ~51,000 to keep a 3-month cycle** **[COMPUTED]**
- Dust: Tabuk station averages **~5.5 dust storms per year** (lower than Riyadh/Al-Ahsa) — [MDPI Geosciences 9(4):162, 2019](https://www.mdpi.com/2076-3263/9/4/162); Saudi-wide 2–3 sandstorm episodes/month late Feb–mid Jul; **45–48 sandstorm days/yr (1970–1990) → 55–65 by 2060–2085** — [ScienceDirect 2025 probabilistic sandstorm study](https://www.sciencedirect.com/science/article/pii/S2590123025033687) **[SOURCED]**
- Birds: *Trends in Ecology & Evolution* 2024 horizon scan lists THE LINE among 15 top biodiversity concerns: its size, **mirrored facades and east–west orientation at the head of the Red Sea** make it "likely to pose a substantial risk to migratory species, particularly passerine birds"; building collisions kill 365–988 M birds/yr in the US alone — [Dezeen, 2024-01-18](https://www.dezeen.com/2024/01/18/the-line-risk-birds-neom-saudi-arabia/) **[SOURCED]**. The Rift Valley/Red Sea flyway is the world's 2nd most important soaring-bird corridor, **>1.5 million soaring birds of 39 species** — [UNDP/BirdLife Migratory Soaring Birds Project](https://migratorysoaringbirds.undp.birdlife.org/en/flyway) **[SOURCED]**

## 5. Daily life inside — mobility

- Prieto-Curiel & Kondor (Complexity Science Hub Vienna), *npj Urban Sustainability* 2023, "Arguments for building The Circle and not The Line": two random residents are **on average 57 km apart**; a random trip takes **≥60 min on average** incl. walk, wait and frequent stops; **86 stations** needed for everyone to be within walking distance, with an **18-min average walk** to a station; "**a line is the least efficient possible shape of a city**" — [Nature/npj](https://www.nature.com/articles/s42949-023-00115-y); [Dezeen 2023-06-27](https://www.dezeen.com/2023/06/27/the-line-circle-city-neom/); [Scientific American](https://www.scientificamerican.com/article/mathematicians-think-saudi-arabias-ambitious-line-city-should-be-a-circle/); [phys.org 2023-06](https://phys.org/news/2023-06-saudi-arabia-line-isnt-revolution.html) **[SOURCED]**
- A circle with the same 34 km² has radius **√(34/π) = 3.3 km** — i.e. the whole city within a ~1-hour walk **[COMPUTED]**
- Speed needed: **170 km in 20 min = 510 km/h average including stops** **[COMPUTED]**. Fastest commercial service on Earth is the Shanghai maglev (designed 431–460 km/h, limited to 300 km/h since 2021); China's CR450 targets 400 km/h commercial; KTX tops out ~305 km/h — [Interesting Engineering](https://interestingengineering.com/transportation/china-tests-next-fastest-commercial-train); [WION top-10 2025](https://www.wionews.com/photos/top-10-fastest-trains-in-the-world-in-2025-1762435972115) **[SOURCED]**
- Load on one corridor: 9 M residents × ~1.5 trips/day ≈ **13.5 M rides/day ≈ 2× all of Seoul Metro lines 1–8 (6.6 M/day, 2024) and ~7× Line 2 (1.96 M/day)** — Seoul figures from [디지털타임스 '매일 669만명'](https://www.dt.co.kr/article/12050634); [아시아경제 2026-03-10, 2호선 하루 196만](https://view.asiae.co.kr/article/2026031016251731747) **[SOURCED inputs, COMPUTED ratio]**

## 6. Daily life inside — light, air, fire

- Canyon geometry: 200 m wide, 500 m walls → sun must be **above 68.2°** to reach the ground. At Tabuk (~28° N) noon sun is **38.6° (winter solstice), 62° (equinox), 85° (summer solstice)** → the canyon floor gets **~3 h of direct sun/day in midsummer and none for roughly half the year** (east–west orientation; ignores skylights/light wells) **[COMPUTED]**
- Critics: "No ray of light would ever reach the ground in the narrow canyon… massive energy consumption for artificial lighting, air conditioning" — [Lampoon Magazine, 2025-03-24](https://lampoonmagazine.com/article/2025/03/24/the-line-city-project-saudi-arabia-neom-sustainable-architecture-critics-dystopian-future/); NEOM's counter: the 200 m width is "intentional… allowing natural light to penetrate from the sides" — [ArchDaily, The Line at a Crossroads](https://www.archdaily.com/1039911/the-line-at-a-crossroads-revisiting-neoms-vision-for-a-utopian-city) **[SOURCED]**
- Evacuation: descending 160 flights takes a healthy adult "well over an hour"; stair descent is >70 % of total evacuation time in super-high-rises; Burj Khalifa and Lotte World Tower rely on evacuation elevators and "achieving the one-hour target remains a challenge in complex, high-occupancy environments" — [MDPI Buildings 14(10):3164, 2024](https://www.mdpi.com/2075-5309/14/10/3164); [SkySaver Burj Khalifa evacuation](https://skysaver.com/blog/burj-khalifa-evacuation-plan-how-it-works/) **[SOURCED]**. THE LINE would stack 9 M people at Lotte-Tower height. 
- Guardian critic Oliver Wainwright: a "habitable supercomputer" with an "ominous dystopian undertone"; "If ever there was an urban vision that embraced our end-of-days climate apocalypse, then this is it" — [Archinect summary of Guardian review, 2022](https://archinect.com/news/article/150323438/oliver-wainwright-explores-the-architectural-history-behind-saudi-arabia-s-planned-the-line-megacity) **[SOURCED]**

## 7. Energy — 9 M people vs the Saudi grid

- Saudi per-capita electricity **13,390 kWh (2024)**; South Korea **12,090 kWh (2025)** — [Wikipedia: List of countries by electricity consumption](https://en.wikipedia.org/wiki/List_of_countries_by_electricity_consumption) **[SOURCED]**
- Saudi production **402,628 GWh (2024)** — [CEIC](https://www.ceicdata.com/en/indicator/saudi-arabia/electricity-production); consumption ~406 TWh (2024) — [Worldometer](https://www.worldometers.info/electricity/saudi-arabia-electricity/); **grid peak 74.8 GW (9M 2024, +5.8 %)** — [MEES](https://www.mees.com/2025/8/15/power-water/saudi-electricity-consumption-smashes-records-in-1h-2025/aa337fd0-79f9-11f0-915c-49dffedccc82) **[SOURCED]**
- 9 M × 13,390 kWh = **120.5 TWh/yr ≈ 30 % of Saudi Arabia's entire 2024 output** (108.8 TWh / 27 % at Korean per-capita); proportional peak ≈ **21 GW** **[COMPUTED]**
- To supply that with solar alone (assume 22 % capacity factor, 50 MW/km²): **~63 GW of PV ≈ 1,250 km² ≈ 37× the city's own footprint** **[COMPUTED, low confidence on assumptions]**
- Note: Argaam reports a much lower **4,533 kWh (2023)** "per capita" figure (likely per consumer account) — [Argaam](https://www.argaam.com/en/article/articledetail/id/1801864); using it gives 41 TWh (10 %). We use the Wikipedia/OWID-style figure.

## 8. How it would look from space / from a plane

- From ISS altitude (~400 km) 1 arcminute ≈ 116 m; THE LINE's 200 m width ≈ **1.7 arcmin** → just resolvable to the naked eye as a 170 km bright hairline (the Great Wall, ~5–7 m wide, is not) **[COMPUTED]**
- Even the 2022–24 excavation trench is already visible in satellite imagery as "a perfectly straight scar" across NW Saudi Arabia — [Airbus Space Solutions progress update](https://space-solutions.airbus.com/resources/news/various/progress-update-on-neom-saudi-arabia-s-futuristic-city/); [The Conversation explainer](https://theconversation.com/what-is-the-line-the-170km-long-mirrored-metropolis-saudi-arabia-is-building-in-the-desert-188639) **[SOURCED]**
- From a 10 km cruising altitude the horizon is ~357 km away, so the full 170 km would fit in one window view **[COMPUTED]**

## 9. Who would actually live there?

- Saudi 2022 census: **32,175,224 people; 18.8 M Saudis (58.4 %), 13.4 M non-Saudis (41.6 %)** — [SPA, 2023-05-31](https://www.spa.gov.sa/w1911463) **[SOURCED]** → 9 M residents = **28 % of the kingdom's whole population**, or 48 % of all Saudi citizens **[COMPUTED]**
- Gulf "instant city" labor model: **Dubai 3,863,600 people (end-2024), 92.0 % expatriates**; UAE 88.5 % foreign — [Dubai.ae](https://www.dubai.ae/population-and-vital-statistics); [GMI](https://www.globalmediainsight.com/blog/dubai-population-statistics/) **[SOURCED]**; **Qatar: migrants ≈ 94 % of workers and 86–88 % of population** — [Migration Policy Institute](https://www.migrationpolicy.org/country-resource/qatar); [Wikipedia: Demographics of Qatar](https://en.wikipedia.org/wiki/Demographics_of_Qatar) **[SOURCED]**
- Construction labor: ITV "Kingdom Uncovered" (Oct 2024) — **~21,000 foreign workers from India, Bangladesh, Nepal died since Vision 2030 began (2017)**; The Line workers described 16-hour days, 14 days straight, 3-hour unpaid bus commutes — [The Architect's Newspaper 2024-10](https://www.archpaper.com/2024/10/documentary-reveals-21000-workers-killed-saudi-vision-2030-neom/); [Business & Human Rights Resource Centre](https://www.business-humanrights.org/en/latest-news/saudi-arabia-itv-finds-migrants-constructing-the-line-at-megacity-project-neom-experience-egregious-labour-rights-abuse/) **[SOURCED]**; the 21,000 total is an all-cause aggregate and is disputed — [Sporting Intelligence](https://sportingintelligence832.substack.com/p/revealed-saudi-2034-death-data-wrong). NEOM CEO Nadhmi al-Nasr departed Nov 2024 — [Dezeen 2024-11-13](https://www.dezeen.com/2024/11/13/neom-ceo-departs-worker-fatalities-human-rights-abuses/)
- NEOM's own revised expectation: **1.5 M residents by 2030 → fewer than 300,000; first phase 170 km → 2.4 km** — [Bloomberg 2024-04-05](https://www.bloomberg.com/news/articles/2024-04-05/saudis-scale-back-ambition-for-1-5-trillion-desert-project-neom); [New Civil Engineer 2024-04-08](https://www.newcivilengineer.com/latest/neom-plans-for-saudi-arabias-linear-city-cut-from-170km-to-2-4km-08-04-2024/) **[SOURCED]**

## 10. The realistic prior — how other "instant cities" turned out

| City | Plan | Reality | Source |
|---|---|---|---|
| 송도국제도시 (Incheon) | 계획인구 **265,611명**, 2003–2030 | **212,085명 (2024-11)** ≈ 80 % after 21 years; long criticized as "ghost town" of empty cafés | [인천경제자유구역청 개발개요](https://www.ifez.go.kr/investment/content/view.do?sn=37); [Atlas of Urban Tech](https://atlasofurbantech.org/cases/kor-incheon-songdo-ibd/) |
| 세종 행복도시 | 신도시 목표 **50만**; 세종시 80만 목표 | 신도시 **31.1만 (62.2 %)**, 2025; 80만 달성 시점 2030→2040으로 연기 | [비즈워치 2025-05-13](https://news.bizwatch.co.kr/article/real_estate/2025/05/13/0031); [디트NEWS24](https://www.dtnews24.com/news/articleView.html?idxno=758269) |
| Masdar City (Abu Dhabi) | 2006 launch, $22 bn, **50,000 residents by 2016** | **~6,000 residents (2024)**, mostly students/foreign experts; ~15,000 "live and work" (2025) | [Wikipedia: Masdar City](https://en.wikipedia.org/wiki/Masdar_City); [ryanjhite 2024-11-13](https://www.ryanjhite.com/2024/11/13/masdar-city-the-rise-and-stagnation-of-the-uaes-eco-city-dream/) |
| Forest City (Johor, Malaysia) | Country Garden, **700,000 residents**, ~$100 bn | **~9,000 residents claimed (2023–24), ~1 % occupied, ~15 % built**; site visits suggest ≤2,000; rebranded as tax-free Special Financial Zone 2024 | [Foreign Policy 2024-03-18](https://foreignpolicy.com/2024/03/18/malaysia-china-real-estate-countrygarden-forestcity/); [Domus 2024-07-19](https://www.domusweb.it/en/sustainable-cities/2024/07/19/forest-city-the-case-of-the-ghost-town-on-the-malaysian-coast.html) |

Pattern: even well-funded, well-located new towns reach 60–80 % of plan after two decades (Songdo, Sejong); isolated or foreign-buyer-dependent ones land at 1–12 % (Forest City, Masdar).

---

## Open questions / caveats
1. All page fetches were blocked; every figure is from search extracts of the cited URL — verify before air.
2. Seoul density for 2023/2024 not retrieved; 2022 (15,550/km²) used.
3. NEOM never published an energy-demand estimate for THE LINE; our 120 TWh is per-capita scaling. A "Heidelberg University: solar the size of Slovakia" claim (Lampoon) could not be verified.
4. No pricing or rent data ever existed for THE LINE, so "who could afford it" rests on Gulf expat-share analogies.
5. The "2.1 billion birds on the Red Sea flyway" figure appears only on low-quality sites; the BirdLife/UNDP soaring-bird count (>1.5 M) is the defensible number.
6. The official 135 × 800 m modules only sum to 108 km; unclear how the remaining ~62 km was meant to be used.
