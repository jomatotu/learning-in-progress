type LearningPageProps = { html: string }

// Runs the generated page in a sandbox: scripts only, no access to our app, cookies, or storage.
export function LearningPage({ html }: LearningPageProps) {
  return (
    <iframe
      title="Your learning page"
      sandbox="allow-scripts"
      srcDoc={html}
      className="w-full flex-1"
    />
  )
}
