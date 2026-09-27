# Research sweep — "critique": expert critique & physics of a 170 km mirrored linear city

Project: "사우디의 네온 시티, 진짜로 지어졌다면?" (~90 s Remotion motion-graphics video, Korean on-screen text). (Brief spelling "지어졸다면" is a typo → use 지어졌다면.)
Sweep date: 2026-09-27. Method: 30+ web searches (EN/KO); direct page fetches were blocked by the network proxy for nearly all news/academic hosts, so figures were cross-checked across multiple search-result summaries and the primary URL is recorded for each claim. Confidence is noted per finding.

> **Verifier pass (2026-09-27):** an adversarial fact-check was attempted on all 25 findings. The session's WebSearch budget was already exhausted (200/200) and every cited host (nature.com, dezeen, cell.com, newsweek, semafor, archpaper, alqst, wikipedia, arxiv, archive.org, sciencedirect, CNN, Korean outlets …) returned 403 from the egress proxy, so **no item could be re-fetched live**. Grades rest on (a) independent recomputation of every derived number (all reproduce exactly — see F2/F3/F4/F8), (b) cross-checks against the independently written sibling sweeps `reality.md`, `vision.md`, `whatif.md`, `korea.md`, and (c) the verifier's own knowledge (reliable to ~mid-2026). Tags: **[VERIFIER: confirmed]**, **[VERIFIER: CORRECTED]**, **[VERIFIER: unverifiable]**. Anything dated after ~June 2026 remains unverifiable until a session with page access re-checks it. Section 10 lists facts the sweep missed. Summary table at the end.

Korean on-screen vocabulary used by Korean media: 네옴시티 / 더 라인, **선형 도시** (press/official term; 직선 도시 is the colloquial variant — `korea.md` K4), 거울 외벽(미러 파사드), 철새 이동 경로, 내재 탄소, 해수 담수화·농축수(염수), 후와이타트 부족 강제 이주, 사형 선고, 이주노동자 사망, 유령도시, 고속철(도).

---

## 1. Transit geometry — "everyone is far from everyone"

### F1. The peer-reviewed math: 57 km apart, 86 stations, 60+ minutes — **[VERIFIER: confirmed]**
Rafael Prieto-Curiel & Dániel Kondor (Complexity Science Hub, Vienna), *"Arguments for building The Circle and not The Line in Saudi Arabia"*, **npj Urban Sustainability 3, 35 (June 2023)**. Modelling the announced geometry (170 km × 200 m, 9 million people), they find two randomly chosen residents are on average **57 km apart**; the city would need **86 train stations** to keep everyone within walking distance of one (average walk to a station ≈ 18 min per `whatif.md`); and a random trip would take **at least 60 minutes on average** including walking, waiting and a train that stops frequently. Prieto-Curiel: "A line is the least efficient possible shape of a city." Confidence: high.
- Verifier check: for uniform density on a 170 km segment the mean separation is exactly L/3 = 56.7 km, so 57 km is the analytic result, not a simulation artefact. Full text not fetchable; numbers agree with the independent `whatif.md` sweep and with the verifier's recollection of the paper.
- https://www.nature.com/articles/s42949-023-00115-y
- https://www.dezeen.com/2023/06/27/the-line-circle-city-neom/ (2023-06-27)
- https://www.scientificamerican.com/article/mathematicians-think-saudi-arabias-ambitious-line-city-should-be-a-circle/
- Korean term: 선형 도시 (직선 도시), 평균 이동 거리

### F2. The Circle alternative: same 34 km², 20× shorter trips — **[VERIFIER: confirmed]**
Same authors: a circle with the same 34 km² footprint has a **radius of ~3.3 km (diameter ~6.6 km ≈ 4.1 mi)** and the average distance between two random residents falls to **~2.9 km** — roughly one-twentieth of The Line's 57 km, and most trips become walkable or cyclable. Confidence: high.
- Verifier check: r = √(34/π) = 3.29 km; mean distance between two random points in a disc = 128r/(45π) = 2.98 km; 57/2.98 = 19.1×. All consistent.
- https://www.nature.com/articles/s42949-023-00115-y ; https://www.newswise.com/articles/saudi-arabia-s-the-line-not-a-urban-living-revolution

### F3. The "20 minutes end-to-end" claim requires 510 km/h with zero stops (derived math) — **[VERIFIER: CORRECTED — origin date]**
NEOM's promise of a high-speed rail with "end-to-end transit of 20 minutes" **first appeared in MBS's 10 January 2021 launch of THE LINE** (then 170 km, 1 million residents, no height/mirror yet — `reality.md`, OFFICIAL) and was repeated in the **25 July 2022** reveal (9 million, 34 km², 200 m wide, 500 m tall) and on NEOM's site; the WSJ "Mirror Line" leak of 24 July 2022 also carried it. NEOM's own "THE SPINE" marketing spoke of trains at "more than 500 km/h" (`whatif.md`, Hotelier Middle East / Arabian Business). 170 km ÷ (20/60 h) = **510 km/h average, nonstop**. No commercial train has ever run that fast: CR400 "Fuxing" operates at 350 km/h (→ 29.1 min nonstop), the Shanghai maglev's top commercial speed was 431 km/h (→ 23.7 min; limited to 300 km/h since 2021 → 34 min), and Japan's Chuo Shinkansen SCMaglev (505 km/h, not due before 2034) would need 20.2 min with no intermediate stop. Confidence: high (claim) / high (arithmetic).
- Verifier: arithmetic reproduced exactly. The sweep attributed the 20-minute promise only to the July 2022 reveal; it dates from January 2021. On screen, cite "2021년 1월 발표" for the promise itself.
- Official claim: https://www.aljazeera.com/news/2022/7/25/saudi-arabia-to-build-1tr-mirrored-skyscraper-in-neom ; https://en.wikipedia.org/wiki/The_Line,_Saudi_Arabia
- Train speeds: https://en.wikipedia.org/wiki/Shanghai_maglev_train ; https://en.wikipedia.org/wiki/Fastest_trains_in_China ; https://www.jrpass.com/Fast-Trains-Maglev-Trains

### F4. With 86 stations the 20-minute train is physically impossible (derived math) — **[VERIFIER: arithmetic confirmed; 230 km/h figure unverifiable]**
86 stations over 170 km = one every **2.0 km**. Dwell time alone (85 stops × 30 s) = **42.5 min** — already more than double the promise. Between stations 2 km apart, a train accelerating and braking at metro-like 1.0 m/s² peaks at only **~161 km/h** and needs ~89 s per hop; an all-stops run is ≈ **2.8 hours** (≈3.7 h at HSR-typical 0.5 m/s², where the peak is only ~114 km/h). Reaching 510 km/h at 0.5 m/s² takes ~20 km of track — ten station spacings. Separately, a 2024 report described a NEOM rail infrastructure contract designed for **up to 230 km/h**, which gives **44 min** nonstop. Confidence: high (arithmetic) / **low-medium** (230 km/h figure — single secondary report, page not fetchable, not corroborated by any sibling sweep; do not put "230 km/h" on screen without re-checking the Newsweek page).
- Verifier: all figures recomputed (169 min / 222 min / 20.1 km / 44.3 min) and match.
- 86 stations: https://www.nature.com/articles/s42949-023-00115-y
- 230 km/h: https://www.newsweek.com/neom-saudi-arabia-high-speed-rail-line-1931845

### F5. Alain Bertaud: cities are labour markets, "I'm bearish" — **[VERIFIER: unverifiable]**
Alain Bertaud (ex-World Bank principal urban planner, NYU Marron Institute, author of *Order Without Design*) argues a city's productivity depends on how many jobs are reachable within ~1 hour; a line minimises that. Asked about NEOM on *Conversations with Tyler* (2019) he answered "I'm bearish… You don't create a city by just putting concrete." Confidence: **medium** (Bertaud's labour-market thesis is well documented; the NEOM exchange is consistent with the verifier's recollection of the episode, but the exact wording and the episode number "76" could not be re-checked — the Bertaud episode aired autumn 2019; verify episode number and quote before use, or paraphrase without quotation marks).
- https://conversationswithtyler.com/episodes/alain-bertaud/ ; https://marroninstitute.nyu.edu/blog/alain-bertaud-cities-as-labor-markets ; https://thedailyeconomy.org/article/saudi-arabia-didnt-learn-anything-from-chinas-ghost-cities/

## 2. Mirrored facade & bird migration

### F6. Named a top-15 global conservation issue for 2024 — **[VERIFIER: confirmed, with a citation caveat]**
Sutherland et al., *"A horizon scan of global biological conservation issues for 2024"*, **Trends in Ecology & Evolution (Jan 2024 issue; online Dec 2023)**: The Line's dimensions (500 m × 200 m × 170 km), mirrored façades, possible rooftop wind turbines and **east–west orientation at the head of the Red Sea** mean it "is likely to pose a substantial risk to migratory species, particularly passerine birds." Context given in the scan: an estimated **2.1 billion songbirds and near-passerines** migrate between Europe and Africa each year (Hahn et al. 2009, *Oikos*) — this is the **whole Europe–Africa system, not the Red Sea flyway alone**; building collisions already kill 365–988 million birds/yr in the USA (Loss et al. 2014) and 16–42 million in Canada (Machtans et al. 2013). Confidence: high.
- Verifier: `whatif.md` notes the 2.1 bn figure circulates on low-quality sites; it is nonetheless the peer-reviewed Hahn et al. estimate cited by the horizon scan. For a flyway-specific number use BirdLife/UNDP's **>1.5 million soaring birds** on the Rift Valley/Red Sea flyway (https://migratorysoaringbirds.undp.birdlife.org/en/flyway).
- https://www.cell.com/trends/ecology-evolution/fulltext/S0169-5347(23)00295-1
- https://www.dezeen.com/2024/01/18/the-line-risk-birds-neom-saudi-arabia/ (2024-01-18)
- Korean term: 철새 이동 경로, 조류 충돌

### F7. The Gulf of Aqaba is one of the great Palearctic–African bottlenecks; NEOM's reply — **[VERIFIER: CORRECTED — raptor count wording]**
Eilat, at the head of the Gulf of Aqaba, is one of the world's major raptor-migration bottlenecks: spring counts **average roughly 540,000 raptors** (reported range ≈456,000–619,000), with **record seasons above 1 million** (≈1.2 million in spring 1985) — the sweep's "more than 1 million each year" overstated this; the yearly figure is ~half a million. It includes most of the world's Levant sparrowhawks and endangered steppe eagles; the Red Sea/Gulf act as a deflection barrier that concentrates soaring birds. NEOM's Tarek Qaddumi (executive director, urban planning) told Dezeen design measures would reduce bird danger and staff were monitoring migration. Confidence: medium (counts from a single news source, not re-fetched; "three great bottlenecks" framing is journalistic, not a technical classification).
- https://www.timesofisrael.com/a-key-stop-on-the-great-bird-flyway-eilat-sees-steep-dive-in-migrating-flocks/ ; https://www.dezeen.com/2024/01/18/the-line-risk-birds-neom-saudi-arabia/

## 3. Shadow, wind, microclimate

### F8. Daylight in a 500 m × 200 m canyon (derived from geometry) — **[VERIFIER: confirmed (recomputed)]**
The Line sits at ~28.1°N (≈28°06′N 35°18′E) and runs roughly east–west (more precisely WSW–ENE from the Gulf of Aqaba inland), so its south wall shades the canyon floor. The floor gets direct noon sun only when solar elevation > arctan(500/200) = **68.2°**, i.e. when solar declination > 6.3° — roughly **7 April to 5 September**. Noon shadow of a 500 m wall: **629 m at winter solstice** (3× the gap), **267 m at the equinoxes** (still > 200 m), 41 m at summer solstice. Lower floors would be in shade most of the year — contradicting renders of sunlit ground-level greenery. Confidence: high (arithmetic on public geometry; not an expert quote). Caveat for on-screen use: this is an idealised open canyon; the design's sky-bridges and interior floors would shade further, not less, but the real axis is not exactly E–W.
- Verifier: noon elevations 38.5° / 61.9° / 85.3° and all shadow lengths reproduced exactly.
- Coordinates: https://en.wikipedia.org/wiki/The_Line,_Saudi_Arabia

### F9. Experts call the liveability/sustainability claims "naive"; ventilation doubted — **[VERIFIER: confirmed (cross-checked with vision.md)]**
Dezeen, 2022-08-08: Philip Oldfield (UNSW) said "You cannot build a 500-metre-tall building out of low-carbon materials", noting the wind loads on a 500 m structure demand "a phenomenal quantity of steel, glass and concrete"; Hélène Chartier (C40 Cities) said she would not "want to live in a place where it's so narrow". Analysts also question whether the promised natural-ventilation microclimate survives 45 °C desert summers without energy-intensive cooling. Confidence: high (quotes) / medium (ventilation — qualitative, no CFD study found).
- https://www.dezeen.com/2022/08/08/sustainability-liveability-the-line-saudi-170km-city-naive/ ; https://atlasofurbantech.org/cases/sau-neom-theline/

### F10. Mirror facades already have a track record of frying their surroundings — **[VERIFIER: confirmed; "6× brighter" unverifiable]**
Rafael Viñoly's concave glass Vdara hotel (Las Vegas, Sept 2010) produced a "death ray" that singed a guest's hair and melted plastic; London's 20 Fenchurch St "Walkie-Talkie" (Sept 2013, also Viñoly) melted parts of a parked Jaguar. The widely quoted "~6× brighter than sunlight" multiplier could not be re-checked — drop the multiplier on screen and say "reflected sunlight hot enough to melt car trim". The Line's flat mirrors would not focus light, but 170 km of reflective glass in a desert re-radiates solar heat outward and reflective glass is a leading cause of bird strikes. Confidence: high (precedents) / medium (extrapolation).
- https://edition.cnn.com/2013/09/03/world/europe/uk-london-building-melts-car ; https://www.nbcnews.com/news/amp/wbna39403349 ; https://physicsworld.com/a/death-ray-reflections-from-skyscrapers-modelled-by-scientists/

## 4. Embodied carbon

### F11. ~1.8 billion tonnes CO₂ — over four years of UK emissions — **[VERIFIER: confirmed (cross-checked with vision.md)]**
Prof. Philip Oldfield (Head, School of Built Environment, UNSW) estimated **upwards of 1.8 billion tonnes of embodied CO₂** to build The Line — "equivalent to more than four years of the UK's entire emissions" — and said this "will overwhelm any environmental benefits". The figure is Oldfield's own estimate (floor area × typical embodied carbon for very tall buildings), widely repeated (ArchDaily 2025 etc.). Confidence: high (attribution) / medium (the number itself is one expert's estimate). Verifier: 1.8 bn t ÷ UK ≈0.4–0.45 bn t CO₂/yr = 4–4.5 years, consistent.
- https://www.dezeen.com/2022/08/08/sustainability-liveability-the-line-saudi-170km-city-naive/ (2022-08-08) ; https://www.archdaily.com/1039911/the-line-at-a-crossroads-revisiting-neoms-vision-for-a-utopian-city
- Korean term: 내재 탄소(건설 과정 탄소 배출)

## 5. Water, desalination, brine

### F12. The flagship "zero-brine" desalination plant was cancelled — **[VERIFIER: unverifiable (consistent)]**
June 2022: ENOWA (NEOM's utility) signed an MoU with Veolia and Itochu for a **500,000 m³/day**, 100 %-renewable desalination plant with zero liquid discharge, turning brine into industrial salt, bromine, boron, potassium, gypsum and magnesium, to meet ~30 % of NEOM's water demand (a joint development agreement followed in Dec 2022). The agreement **expired in May 2024** and was not renewed (MEED: "$1.5 bn project halted"). In 2025 NEOM also reportedly cancelled the 150,000 m³/day "Moonlight" plant near Duba after tendering it in 2024, citing "evolved" water requirements. Confidence: **medium** (the Veolia/Itochu MoU and its lapse match the verifier's knowledge; the Moonlight capacity, bidder list and cancellation date rest on trade-press items that could not be re-fetched — no sibling sweep covers them).
- https://www.wateronline.com/doc/enowa-itochu-and-veolia-sign-mou-to-build-by-renewable-energy-in-neom-0001 ; https://smartwatermagazine.com/news/smart-water-magazine/neom-halts-15-billion-desalination-facility-project ; https://www.meed.com/neom-cancels-15bn-desalination-plant-project ; https://smartwatermagazine.com/news/smart-water-magazine/neom-cancels-moonlight-desalination-plant
- Korean term: 해수 담수화, 농축수(염수) 배출

### F13. Brine baseline: 1.5 litres of brine per litre of fresh water — **[VERIFIER: confirmed]**
Jones et al., *Science of the Total Environment* 657:1343–1356 (20 March 2019; UNU-INWEH): 15,906 plants produce ~95 million m³/day of desalinated water and ~**141.5 million m³/day of brine** (≈1.5 L brine per L water); Saudi Arabia, UAE, Kuwait and Qatar account for **55 %** of global brine. A 9-million-person city on the Red Sea would add to this in a semi-enclosed sea. Confidence: high.
- https://www.sciencedirect.com/science/article/abs/pii/S0048969718349167

## 6. Human cost

### F14. ~20,000 Huwaitat ordered out; Abdul Rahim al-Huwaiti shot dead 13 April 2020 — **[VERIFIER: confirmed]**
In January 2020 the Tabuk Emirate announced compulsory eviction of al-Khuraybah, Sharma and Gayal; rights groups put the number of Huwaitat tribespeople affected at ~**20,000**. Abdul Rahim Ahmad Mahmoud al-Huwaiti, who posted videos refusing to leave, was killed by security forces at his home in al-Khuraybah on **13 April 2020**; authorities said he fired first, activists disputed it. Confidence: high.
- https://www.alqst.org/en/post/last-inhabitants-of-al-khuraiba-village-evicted-to-make-way-for-neom ; https://www.aljazeera.com/news/2020/4/17/saudi-activists-dispute-official-narrative-on-al-hwaiti-killing ; https://en.wikipedia.org/wiki/Abdul_Rahim_al-Huwaiti
- Korean term: 후와이타트 부족 강제 이주

### F15. Three men sentenced to death for opposing eviction — **[VERIFIER: confirmed]**
On **2 Oct 2022** the Specialised Criminal Court sentenced Shadli (Abdul Rahim's brother), Ibrahim and Ataullah al-Huwaiti to death under the Counter-Terrorism Law over peaceful opposition including tweets; the appeal court upheld the sentences on **23 Jan 2023**; UN human-rights experts issued an alarm on **3 May 2023**. Others received 15–50-year prison terms. No execution or Supreme Court ruling is known to the verifier as of mid-2026; state on screen as "사형 선고 확정(항소심)" rather than "집행". Confidence: high.
- https://www.alqst.org/en/post/death-sentences-upheld-for-three-men-who-resisted-neom-project ; https://www.ohchr.org/en/press-releases/2023/05/saudi-arabia-un-experts-alarmed-imminent-executions-linked-neom-project ; https://www.dezeen.com/2022/10/17/neom-death-sentences-saudi-arabia/
- Korean term: 사형 선고

### F16. BBC (8 May 2024): an order to use lethal force — **[VERIFIER: confirmed]**
Former Saudi intelligence officer Col. Rabih Alenezi told the BBC that an April 2020 order described the Huwaitat as "many rebels" and said "whoever continues to resist [eviction] should be killed", licensing lethal force against those who stayed; he says he avoided the mission but it went ahead. Saudi authorities did not respond to the BBC. Confidence: high (reported allegation — label as "BBC 보도·전직 정보요원 주장" on screen).
- https://www.business-standard.com/world-news/saudi-arabia-neom-smart-city-project-saudi-ordered-to-kill-those-who-resisted-eviction-for-futuristic-city-124051000885_1.html ; https://en.wikipedia.org/wiki/Rabih_Alenezi

### F17. ITV "Kingdom Uncovered" (Oct 2024): 21,000 migrant-worker deaths since 2017 — **[VERIFIER: CORRECTED — scope of the 21,000]**
ITV's documentary *Kingdom Uncovered: Inside Saudi Arabia* (Oct 2024) reported that **more than 21,000 Indian, Bangladeshi and Nepalese nationals have died in Saudi Arabia since 2017**, and filmed The Line's workers describing **16-hour days, 14 days straight, unpaid 3-hour bus commutes, ~4 hours' sleep** and wages delayed up to 10 months. **The 21,000 is an all-cause death total for those three nationalities in the whole kingdom (all ages, all causes), not a count of construction deaths and not NEOM-specific; its use as a "Vision 2030 death toll" has been disputed** (`whatif.md` cites Sporting Intelligence's critique). NEOM said it would investigate; CEO Nadhmi al-Nasr left on 12 Nov 2024 (Aiman al-Mudaifer acting CEO). Confidence: high (documentary content) / medium (interpretation of the 21,000). On screen: "ITV 보도: 2017년 이후 인도·방글라데시·네팔 노동자 2만1천여 명 사망(전체 사망자 기준)".
- https://www.archpaper.com/2024/10/documentary-reveals-21000-workers-killed-saudi-vision-2030-neom/ ; https://www.business-humanrights.org/en/latest-news/saudi-arabia-itv-finds-migrants-constructing-the-line-at-megacity-project-neom-experience-egregious-labour-rights-abuse/ ; https://www.dezeen.com/2024/11/13/neom-ceo-departs-worker-fatalities-human-rights-abuses/ ; https://sportingintelligence832.substack.com/p/revealed-saudi-2034-death-data-wrong
- Korean term: 이주노동자 사망

## 7. Aesthetic critique of the renders

### F18. "Habitable supercomputer", "end-of-days" — and solarpunk's look without its values — **[VERIFIER: CORRECTED — Wainwright date]**
Oliver Wainwright (Guardian, **27 July 2022**, not August) called the design a "habitable supercomputer" and wrote "If ever there was an urban vision that embraced our end-of-days climate apocalypse, then this is it", linking the "ominous dystopian undertone" to MBS's taste for cyberpunk. Rowan Moore (Observer) called it nonsensical self-promotion and predicted much of it would never be built. Slate (Henry Grabar, Aug 2022): "100 miles of real estate clichés". Solarpunk writers note The Line borrows the genre's greenery-on-glass imagery but not its non-negotiables — consent, shared ownership, maintainability by residents — since it is top-down and sovereign-wealth-funded. Confidence: high for Wainwright (cross-checked in `vision.md`/`whatif.md`); medium for the exact Moore/Slate wording (not re-fetched — paraphrase rather than quote).
- https://archinect.com/news/article/150323438/oliver-wainwright-explores-the-architectural-history-behind-saudi-arabia-s-planned-the-line-megacity ; https://archinect.com/news/article/150406100/a-spectacle-of-reform-rowan-moore-throws-cold-water-on-neom-s-motivation-and-sustainable-claims ; https://slate.com/business/2022/08/neom-renderings-cliches-mbs.html ; https://builtin.com/articles/solarpunk
- Korean term: 렌더링(조감도), 디스토피아

## 8. What actually happened (for the "what if" contrast)

### F19. April 2024: 170 km → 2.4 km by 2030; 1.5 million → under 300,000 — **[VERIFIER: confirmed]**
Bloomberg (2024-04-05) reported officials expect only **2.4 km** of The Line to be finished by 2030 and **fewer than 300,000** residents (vs 1.5 million promised for 2030); PIF had not approved NEOM's 2024 budget and a contractor began layoffs. Korean press (디지털타임스 2024-04-16: "170km→2.4km 대폭 축소…건설업계 결국 '들러리'") noted 현대건설·삼성물산's involvement and NEOM's cost swelling from $500 bn toward $1.2 trn (Bloomberg's own headline figure was $1.5 trn — quote one or the other with its source). Saudi ministers publicly denied a scale-back (Apr 2024). Confidence: high (Bloomberg report; matches `reality.md`, `vision.md`, `korea.md`).
- https://www.bloomberg.com/news/articles/2024-04-05/saudis-scale-back-ambition-for-1-5-trillion-desert-project-neom ; https://www.dezeen.com/2024/04/08/saudi-arabia-lowers-the-line-residents-2030/ ; https://www.dt.co.kr/article/11578381

### F20. WSJ (March 2025): internal audit put NEOM's end-state at $8.8 trillion by 2080 — **[VERIFIER: confirmed]**
A ~100-page internal audit (McKinsey-assisted, presented to the board in spring 2024) estimated **$8.8 trillion** and **~55 more years (to ~2080)** to reach NEOM's "end-state" and found "evidence of deliberate manipulation" of assumptions by "certain members of management". WSJ ran ~8 Mar 2025; NCE/E&T follow-ups 10–12 Mar. NEOM said WSJ was "incorrectly interpreting" the figures — label as "WSJ 보도(내부 감사)". Confidence: high.
- https://www.newcivilengineer.com/latest/anticipated-cost-of-saudi-arabias-neom-gigaproject-explodes-from-500bn-to-8-8-trillion-12-03-2025/ ; https://techcrunch.com/2025/03/09/neom-is-reportedly-turning-into-a-financial-disaster-except-for-mckinsey-co/

### F21. July 2025: PIF hires consultants to review whether The Line is feasible at all — **[VERIFIER: confirmed]**
Bloomberg (2025-07-14): PIF asked consulting firms for a strategic review of The Line's practicality and cost, including cutting its 500 m height or its initial ~2.5 km (Hidden Marina) length; NEOM confirmed the review, calling such checks "common practice", and said the project remains "a strategic priority". Acting CEO Aiman al-Mudaifer had begun a comprehensive review earlier in 2025. Confidence: high.
- https://www.bloomberg.com/news/articles/2025-07-14/saudi-arabia-reviews-gigantic-city-at-neom-called-the-line ; https://www.dezeen.com/2025/07/16/the-line-feasibility-review-neom-saudi-arabia/ ; https://www.cnbc.com/2025/07/18/saudi-arabias-the-line-at-neom-is-reviewed-as-it-considers-its-megaprojects.html

### F22. May 2026: work on The Line halted until after 2030 — **[VERIFIER: CORRECTED — $16 bn attribution; otherwise unverifiable (post-knowledge, consistent with reality.md)]**
Semafor (2026-05-22) exclusive: NEOM has **pushed further work on The Line back until after 2030** and will "significantly redesign" the mirrored towers; the 2030 resident target fell from 1.5 million → 300,000 (2024) → about **100,000**; new Trojena investment frozen; Red Sea tourism sites deferred; PIF shifts spending to ports, data centres and the Oxagon industrial city. **The ~$16 bn figure is from a separate Semafor report (2026-06-07) on NEOM's 2026–2030 budget, which earmarks SAR 60 bn (US$16 bn) for contractor termination payments — not from the 22 May article.** Confidence: high that the reports exist (independently recorded by `reality.md` with follow-ups in Domus 27 May, New Atlas June, Archpaper June 2026); the verifier cannot confirm content beyond ~June 2026 — re-check the Semafor pages before on-screen use.
- https://www.semafor.com/article/05/22/2026/saudis-neom-halts-work-on-the-line-until-after-2030 ; https://www.semafor.com/article/06/07/2026/saudis-neom-faces-16-billion-bill-to-cancel-neom-contracts ; https://newatlas.com/architecture/line-neom-saudi-arabia-june-2026-report/ ; https://www.archpaper.com/2026/06/neom-temporary-work-pause-the-line/

## 9. Comparable planned cities that under-delivered

### F23. Masdar, Songdo, Forest City — **[VERIFIER: CORRECTED — Songdo target]**
- **Masdar City** (Abu Dhabi, 2006): planned 50,000 residents (+40,000 commuters), zero-carbon; by 2024 ~**6,000** residents, "zero-carbon" downgraded to "carbon-neutral" and then deferred; cost ~$18–22 bn. Confidence: medium-high.
- **Songdo International City** (Incheon, ~$35–40 bn, Cisco-wired): **the sweep's "target ~500,000 by 2020" is wrong.** The official IFEZ plan population is **265,611**, and the district had **212,085 residents in Nov 2024 (≈80 % of plan after 21 years)** — `whatif.md`, IFEZ development overview. Songdo is therefore a *slow* success, not a 2–100× miss; the "Chernobyl-like ghost town" label (2016 reporting on its empty plazas) describes its early years. Use it as the "even the best case takes 20 years" example, not as a failure.
- **Forest City** (Johor, Malaysia, launched 2014–16, ~$100 bn, Country Garden): planned **700,000** residents; 2023–24 reports found ~9,000 or fewer (~1 % occupancy, ~15 % built), with on-site visits estimating ≤2,000; developer in default; rebranded a Special Financial Zone in 2024. Confidence: medium-high.
- https://e360.yale.edu/features/why-the-luster-is-fading-on-once-vaunted-smart-cities ; https://en.wikipedia.org/wiki/Masdar_City ; https://www.ifez.go.kr/investment/content/view.do?sn=37 ; https://chartercitiesinstitute.org/wp-content/uploads/2024/12/Songdo_Paper_Final.pdf ; https://foreignpolicy.com/2024/03/18/malaysia-china-real-estate-countrygarden-forestcity/ ; https://www.domusweb.it/en/sustainable-cities/2024/07/19/forest-city-the-case-of-the-ghost-town-on-the-malaysian-coast.html
- Korean terms: 마스다르 시티, 송도국제도시, 포레스트 시티, 유령도시

### F24. Ordos Kangbashi and Arcosanti — **[VERIFIER: confirmed (medium on Kangbashi figures)]**
- **Ordos Kangbashi** (Inner Mongolia): planned from 2003, construction from 2004, for **1 million** people on coal wealth; ~30,000 residents in 2009–10 (the archetypal "ghost city"), ~153,000 by 2017 after the target was cut to 300,000 — filled only after ~14 years and a state-led school/office relocation. Kangbashi launch year (2003 vs 2004) and the 2009 head-count vary by source; say "2000년대 초" on screen.
- **Arcosanti** (Arizona, Paolo Soleri, 1970): planned **5,000**; population has hovered between **50 and 150** for five decades. Soleri's "Babel IID" arcology (1969) was drawn for 550,000 people at 1,900 m tall and was never built.
Confidence: high (Arcosanti) / medium (Kangbashi numbers).
- https://en.wikipedia.org/wiki/Kangbashi_District ; https://www.thechinastory.org/yearbooks/yearbook-2017/forum-borderlands/kangbashi-the-richest-ghost-town-in-china/ ; https://en.wikipedia.org/wiki/Arcosanti ; https://www.atlasobscura.com/articles/3473
- Korean terms: 오르도스 캉바시, 아르코산티

### F25. The linear city is a 140-year-old idea that never scaled — **[VERIFIER: confirmed]**
Arturo Soria y Mata proposed the *Ciudad Lineal* in **1882** — a **500 m-wide** strip along a 40 m tram boulevard, planned as a ~50 km ring around Madrid; about 5 km were built and later swallowed by ordinary sprawl (today's Ciudad Lineal district, ~11.4 km², ~230,000 people, is a normal neighbourhood). Nikolai Miliutin's *Sotsgorod* (1930) proposed band cities for Magnitogorsk and Stalingrad; Ludwig Hilberseimer (Bauhaus, 1929+) and Le Corbusier's *cité linéaire industrielle* (1942–45, *Les Trois Établissements humains*) revived it. None produced a functioning linear metropolis. Confidence: high.
- https://en.wikipedia.org/wiki/Linear_city_(Soria_design) ; https://en.wikipedia.org/wiki/Arturo_Soria_y_Mata ; https://mitp-arch.mitpress.mit.edu/pub/o8smvxr0 ; https://www.researchgate.net/publication/337871664_Linear_cities_controversies_challenges_and_prospects

## 10. Added by verifier — adjacent facts the sweep missed (mostly from the independent `reality.md`/`korea.md` sweeps)

- **A1. The 20-minute promise is from 10 Jan 2021**, MBS's launch of THE LINE (1 million residents, zero cars/streets/emissions, construction "Q1 2021") — not a July 2022 invention. **[confirmed; reality.md OFFICIAL]**
- **A2. NEOM's own rail marketing ("THE SPINE") promised trains at "more than 500 km/h"** — i.e. NEOM implicitly conceded the 510 km/h requirement. **[medium; whatif.md, Hotelier Middle East / Arabian Business]**
- **A3. Sept 2025: construction on The Line reportedly suspended** pending the review, ≈2.4 km of piling/raft done, site staff moved to Riyadh; no NEOM/PIF release. **[unverifiable; reality.md SECONDARY]**
- **A4. 25–26 Jan 2026: the 2029 Asian Winter Games at Trojena were postponed; in early Feb 2026 the OCA named Almaty as host instead.** FT (26 Jan 2026): MBS now envisions a NEOM "far smaller" than planned. **[unverifiable live; reality.md + vision.md agree]**
- **A5. 12–13 Mar 2026: NEOM terminated the June-2022 ≈US$1 bn Samsung C&T–Hyundai E&C–Archirodon tunnel contract under The Line** (Hyundai E&C filing; 경향신문/아시아경제 2026-03-13 "네옴시티 터널공사 계약 해지"); 29 Mar 2026 Webuild's ≈US$4.7 bn Trojena dams/lake contract terminated. **[unverifiable live; reality.md OFFICIAL filings]**
- **A6. 15 Apr 2026: PIF Governor Al-Rumayyan said "no NEOM projects cancelled", NEOM told to reprioritise** — the official counter-line to use beside the Semafor reporting. **[unverifiable live; reality.md]**
- **A7. 27 May 2026: NEOM terminated Webuild's €1.4 bn "Connector" high-speed rail (57 km Oxagon↔The Line, ~20 % built)** — Korean press "2.5조 고속철 프로젝트 취소". The train that was supposed to make the 20-minute promise real has itself been cancelled. **[unverifiable live; reality.md/korea.md, Webuild release]**
- **A8. June 2026: NEOM's website quietly dropped the "9 million residents", "100 % renewable" and "no roads or cars" claims** (AGBI archive comparison, July 2026). **[unverifiable live; reality.md]**
- **A9. Songdo official figures** (A23 correction): plan 265,611 / actual 212,085 (Nov 2024). **[confirmed via IFEZ source in whatif.md]**
- **A10. Underlying bird statistics** for F6: Hahn et al. 2009 (2.1 bn Europe–Africa migrants), Loss et al. 2014 (US collisions), Machtans et al. 2013 (Canada); BirdLife/UNDP >1.5 million soaring birds on the Rift Valley/Red Sea flyway. **[confirmed]**

---

## Verification status (verifier pass, 2026-09-27 — no live web access; see note at top)

| # | Item | Status | Note |
|---|------|--------|------|
| F1 | 57 km / 86 stations / ≥60 min | confirmed | 57 = L/3 analytically; matches whatif.md |
| F2 | Circle r 3.3 km, 2.9 km mean | confirmed | recomputed: 3.29 km, 2.98 km, 19× |
| F3 | 20 min ⇒ 510 km/h; train benchmarks | **CORRECTED** | promise dates from 10 Jan 2021, not Jul 2022 |
| F4 | 42.5 min dwell / 2.8 h / 230 km/h | arithmetic confirmed; 230 km/h unverifiable | single Newsweek item, not corroborated |
| F5 | Bertaud "bearish" | unverifiable | episode no./wording unchecked; paraphrase |
| F6 | TREE 2024 horizon scan | confirmed | 2.1 bn = whole Europe–Africa system (Hahn 2009) |
| F7 | Eilat raptors | **CORRECTED** | avg ≈540k/yr; >1 M only in record years |
| F8 | Shadow geometry | confirmed | recomputed exactly; sunlit floor ≈ 7 Apr–5 Sep |
| F9 | Dezeen "naive" quotes | confirmed | cross-checked vision.md |
| F10 | Vdara / Fenchurch | confirmed; "6×" unverifiable | drop the multiplier |
| F11 | 1.8 bn t CO₂ | confirmed | expert estimate; 4–4.5 UK-years consistent |
| F12 | Desalination cancellations | unverifiable (consistent) | Moonlight details single-source |
| F13 | Jones 2019 brine | confirmed | |
| F14 | Huwaitat eviction / 13 Apr 2020 | confirmed | |
| F15 | Death sentences 2 Oct 2022 / 23 Jan 2023 | confirmed | UN alert 3 May 2023; no execution known |
| F16 | BBC / Alenezi 8 May 2024 | confirmed | label as allegation |
| F17 | ITV 21,000 | **CORRECTED** | all-cause, all-kingdom total; disputed |
| F18 | Wainwright / Moore / Slate | **CORRECTED** | Guardian piece 27 Jul 2022 |
| F19 | Bloomberg Apr 2024 cut | confirmed | $1.2 tn (KR press) vs $1.5 tn (Bloomberg) |
| F20 | WSJ $8.8 tn audit | confirmed | WSJ ~8 Mar 2025; NEOM disputes |
| F21 | Jul 2025 review | confirmed | |
| F22 | May 2026 halt | **CORRECTED** | $16 bn is Semafor 7 Jun 2026; content post-knowledge |
| F23 | Masdar / Songdo / Forest City | **CORRECTED** | Songdo plan 265,611 not ~500k |
| F24 | Kangbashi / Arcosanti | confirmed (medium) | launch year 2003/04 varies |
| F25 | Soria 1882 etc. | confirmed | |

## Open questions
- Exact assumed train speed and express/local pattern in Prieto-Curiel & Kondor (full text not fetchable through the proxy) — the 60-min figure is theirs; the 510 km/h and dwell-time figures above are our derivation.
- Whether the 230 km/h "design speed" report refers to The Spine passenger service or the freight/connector line — and whether the Newsweek page says it at all.
- Any Saudi Supreme Court ruling or execution (2024–2026) on the three Huwaitat death sentences — none known.
- Peer-reviewed CFD/wind-tunnel studies of the 200 m canyon (none found; only qualitative expert concern).
- Whether the 1.8 bn t CO₂ figure was ever published with a method, or remains an expert estimate quoted by Dezeen.
- All 2026 items (F22, A3–A8) need one live re-fetch of the Semafor/Webuild/Dezeen/AGBI pages before on-screen use.
