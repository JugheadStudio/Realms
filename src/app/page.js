import Link from "next/link";
import { Container, Button } from "react-bootstrap";

export default function HomePage() {
  return (
    <Container className="mt-5 text-white text-center">
      <h1>Welcome to Realms</h1>
      <Button variant="primary" as={Link} href="/adventure-setup">
        Host Adventure
      </Button>
    </Container>
  );
}