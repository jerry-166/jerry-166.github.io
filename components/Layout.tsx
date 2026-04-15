import Header from './Header'
import Footer from './Footer'
import ReadingProgress from './ReadingProgress'
import PageTransition from './PageTransition'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-rice-light">
      <ReadingProgress />
      <Header />
      <main className="flex-1">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
