# Bills — no terminal needed

Everything below is clicking in a browser. You do it once (~20 min). After that, every new version is one button.

## 1. Put the code on GitHub
1. github.com → **New repository** → name it `bills-app` → **Private** → Create.
2. On the empty repo page click **uploading an existing file**.
3. Unzip `bills-app.zip` on your computer, open the folder, select **everything inside it** (including the `.github` folder — on Mac press `Cmd + Shift + .` to show hidden folders) and drag it in → **Commit changes**.

## 2. Make a free Expo account
1. expo.dev → Sign up.
2. Avatar → **Account settings → Access tokens → Create token**. Copy it.

## 3. Get an App Store Connect key
1. appstoreconnect.apple.com → **Users and Access → Integrations → App Store Connect API** → **Generate API Key**. Name: `Expo`, Access: **Admin**.
2. Copy the **Issuer ID** and **Key ID**. Download the `.p8` file (you can only download it once — keep it).
3. Your **Team ID**: developer.apple.com/account → Membership details.

## 4. Create the app in App Store Connect
1. **Apps → + → New App** → iOS, name `Bills` (or any free name), language, bundle ID `com.ossamamektane.bills`, SKU `bills`.
   - If the bundle ID isn't in the list: developer.apple.com → Certificates, IDs & Profiles → Identifiers → + → App IDs → `com.ossamamektane.bills`.
2. Open the app → **App Information** → copy the **Apple ID** (a number like `6741234567`).

## 5. Paste the secrets into GitHub
Your repo → **Settings → Secrets and variables → Actions → New repository secret**. Add these:

| Name | Value |
|---|---|
| `EXPO_TOKEN` | token from step 2 |
| `ASC_KEY_ID` | Key ID |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | open the `.p8` file in TextEdit/Notepad, copy **all** of it |
| `APPLE_TEAM_ID` | Team ID |
| `ASC_APP_ID` | the Apple ID number from step 4 |

(Only if your developer account is a company, also add `APPLE_TEAM_TYPE` = `COMPANY_OR_ORGANIZATION`.)

## 6. Press the button
Repo → **Actions** tab → **Send to App Store** → **Run workflow**.
Wait ~30 min. Green check = the build is in App Store Connect → **TestFlight**.
Install the **TestFlight** app on your iPhone and you'll see Bills there to try.

## 7. Submit for review
In App Store Connect: add screenshots, description, privacy ("Data Not Collected"), age rating, privacy policy URL (`privacy.html` — upload it to your website repo next to `index.html`), pick the build → **Submit for Review**.

## Updating later
Change files on GitHub (or ask AI to) → Actions → **Run workflow** again. Version numbers go up automatically.

If a run goes red, click it, open the red step, copy the error and send it to me.
