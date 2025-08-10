export async function getServerSideProps() {
  return {
    redirect: {
      destination: "https://share.hsforms.com/eu1/d19a1261-38af-47d2-a668-bfb5b3b24cd5?portalId=146230713",
      permanent: false,
    },
  };
}
export default function Contact() { return null; }
