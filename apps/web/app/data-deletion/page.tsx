export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Data Deletion Instructions</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: March 21, 2026</p>

      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">How to Delete Your Data</h2>
          <p>If you would like to delete your AnoTara? account and all associated data, you have two options:</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Option 1 — In-app deletion</h2>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Log in to PAL</li>
            <li>Go to your Profile page</li>
            <li>Scroll down and click "Delete Account"</li>
            <li>Confirm deletion</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Option 2 — Email request</h2>
          <p>Send an email to <a href="mailto:your@email.com" className="text-indigo-400 hover:underline">your@email.com</a> with the subject "Data Deletion Request" and we will delete your account within 30 days.</p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Upon deletion, all your data will be permanently removed including your profile, topics, cards, scores, and notes.</p>
        </section>
      </div>
    </main>
  )
}