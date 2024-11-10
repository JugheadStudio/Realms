"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Button, Modal, Form } from "react-bootstrap";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  // Handle input change and remove spaces
  const handleInputChange = (e) => {
    // Remove all spaces from the input value
    const cleanedCode = e.target.value.replace(/\s+/g, '');
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
      <h1>Welcome to Realms</h1>
      <div className="d-flex justify-content-center gap-4">
        <Button variant="primary" as={Link} href="/adventure-setup">
          Host Adventure
        </Button>
        <Button variant="secondary" onClick={() => setShowModal(true)}>
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
              <Form.Control
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={handleInputChange}
                className="bg-dark text-white"
              />
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
    </Container>
  );
}