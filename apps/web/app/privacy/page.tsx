export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: March 21, 2026</p>

      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Information We Collect</h2>
          <p>We collect your name and profile picture from Google when you log in. We use this to identify your account and display your profile within the app.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">How We Use Your Information</h2>
          <p>Your information is used solely to provide the PAL platform experience. We do not sell or share your personal data with third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Data Storage</h2>
          <p>Your data is stored securely in our database. You may request deletion of your account and data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
          <p>For privacy concerns, contact us at: <a href="mailto:your@email.com" className="text-indigo-400">your@email.com</a></p>
        </section>
      </div>
    </main>
  )
}