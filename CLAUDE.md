# Repository Instructions

## Main branch synchronization

Whenever `blade-hq/public-docs`'s `main` branch is updated and pushed, also synchronize the same `main` commit to the fork `so2liu/public-docs`.

Do not consider a main-branch update complete until both repositories point to the same commit. Verify with:

```bash
git ls-remote https://github.com/blade-hq/public-docs.git refs/heads/main
git ls-remote https://github.com/so2liu/public-docs.git refs/heads/main
```

If the fork is behind, add or use a dedicated remote and push the local `main` branch:

```bash
git remote add so2liu https://github.com/so2liu/public-docs.git  # only if missing
git push so2liu main:main
```
