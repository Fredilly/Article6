// Permanent redirect to / — the landing page is now at the root.
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: true,
    },
  };
}

export default function PreviewHomeRedirect() {
  return null;
}
