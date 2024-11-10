"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  // Handle input change and remove spaces
  const handleInputChange = (e) => {
    // Remove all spaces from the input value
    const cleanedCode = e.target.value.replace(/\s+/g, "");
    setRoomCode(cleanedCode);
  };

  const handleJoinGame = () => {
    if (roomCode) {
      router.push(`/lobby/${roomCode}`);
      setShowModal(false);
    }
  };

  return (
    <Container className="mt-5 text-white text-center">
      <Row className="justify-content-center">
        <Col xs={6}>
          <div className="intro-section mb-5">
            <h1 className="mb-4 home-heading">Welcome to Realms</h1>
            <p className="home-intro">Embark on endless adventures, whether you're playing solo or with friends. With our AI-driven platform, you can dive into any adventure you imagine or explore one of our exciting prebuilt quests.</p>

            <p className="home-intro">Need inspiration? Use it to craft plot lines for your next book, game, or creative project.</p>

            <p className="home-intro">Hosting your own adventure is easy - invite friends to join your story or simply jump into a friend's journey.</p>
            <p className="home-intro">The possibilities are endless, and the adventure starts now!</p>
          </div>

          {/* Buttons for Hosting or Joining */}
          <div className="d-flex justify-content-center gap-4">
            <Button
              variant="primary"
              as={Link}
              href="/adventure-setup"
              size="lg" // Make the button larger
              className="px-5 py-3 fs-4"
            >
              Host Adventure
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowModal(true)}
              size="lg" // Make the button larger
              className="px-5 py-3 fs-4"
            >
              Join Game
            </Button>
          </div>

          {/* Modal for Room Code Input */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Join a Game</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group controlId="roomCode">
                  <Form.Label>Enter Room Code</Form.Label>
                  <Form.Control type="text" placeholder="Enter room code" value={roomCode} onChange={handleInputChange} className="bg-dark text-white" />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleJoinGame}>
                Join
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
}
