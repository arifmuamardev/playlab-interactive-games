# PlayLab — publishing

PlayLab is a **standalone, brand-neutral portfolio project**, not part of any organization’s website.

1. Create a separate **public** GitHub repository, suggested name `playlab-interactive-games`.
2. Upload these files to its default `main` branch.
3. In Settings > Pages, select **GitHub Actions** as the source.
4. The workflow in `.github/workflows/pages.yml` runs prototype checks, compiles source using Vite, and deploys the verified output after pushes to `main`. Pull requests run verification without publishing.
5. Check the Actions tab for the deployment result and perform a two-window projector rehearsal.

The resulting default project Pages address is usually `https://<username>.github.io/playlab-interactive-games/` if Pages is enabled.

Do not add this game to a production organization's site without an explicit publishing decision.

The static files work at `./` relative paths and do not require an API or account. Both windows must share the same browser profile and origin; **they do not synchronize across devices.**
