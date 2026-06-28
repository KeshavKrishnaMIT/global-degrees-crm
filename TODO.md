# TODO

- [x] Fix syntax error in `frontend/src/utils/studentReasoning.js` (extra trailing `}`) and align `preferredIntakes` output.
- [x] Unblock Vite build by adding missing data imports used by `frontend/src/utils/loadUniversityData.js`:
  - [x] `frontend/src/data/world_universities_and_domains.json`
  - [x] `frontend/src/data/world_university_rankings.csv`
- [ ] Upgrade **both** chatbots in `frontend/src/pages/recommendations/index.jsx` to be “reason-first” and live-CRM driven:
  - [ ] Replace keyword/template `LOCAL_TOPICS` + `generateLocalReply` logic with computed analytics executor.
  - [ ] Add follow-up memory (persist last filter/group) inside the chatbot state.
  - [ ] Ensure Student AI Advisor modal follow-ups use the same memory/executor approach.
  - [ ] Keep UI/layout/styling/recommendation-card UI unchanged.
- [ ] Run frontend build/lint and confirm no remaining syntax/runtime errors.

