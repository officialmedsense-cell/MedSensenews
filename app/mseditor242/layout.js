import Script from 'next/script';

export const metadata = {
  title: 'MedSense Editorial Control Center',
  description: 'Staff portal for MedSense News editorial team.',
  robots: 'noindex, nofollow',
};

export default function EditorLayout({ children }) {
  // Nested layouts cannot have <html>/<body> — root layout owns those.
  // ConditionalShell in root layout hides the main site header/footer
  // when the user is on any /mseditor242 route.
  return (
    <>
      <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
      <Script src="https://cdn.quilljs.com/1.3.6/quill.js" strategy="beforeInteractive" />
      {children}
    </>
  );
}
