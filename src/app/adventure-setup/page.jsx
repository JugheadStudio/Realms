"use client";

import { useState } from "react";
import { db } from "../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";

export default function AdventureSetup() {
  const [adventureTitle, setAdventureTitle] = useState("");
  const [adventureSetting, setAdventureSetting] = useState("");
  const [worldLore, setWorldLore] = useState("");
  const [plot, setPlot] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!adventureTitle || !adventureSetting) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!user) {
      setError("You must be logged in to create an adventure.");
      return;
    }

    const roomCode = Math.random().toString(36).slice(2, 8);

    try {
      // Get the host's username from the Firestore users collection
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const username = userDoc.exists() ? userDoc.data().username : "Anonymous";

      const roomRef = doc(db, "rooms", roomCode);
      await setDoc(roomRef, {
        adventureTitle,
        adventureSetting,
        worldLore,
        plot,
        context,
        createdAt: new Date(),
        hostUid: user.uid,
        players: [
          {
            userId: user.uid,
            username, // Use the fetched username
            characterName: null,
            characterType: null,
            characterBackstory: null,
            isReady: false,
          },
        ],
      });

      router.push(`/lobby/${roomCode}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create room. Please try again.");
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center text-white">
        <Col xs={6}>
          <h2 className="text-center">Adventure Setup</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="adventureTitle">
              <Form.Label>Adventure Title</Form.Label>
              <Form.Control
                type="text"
                value={adventureTitle}
                onChange={(e) => setAdventureTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="adventureSetting">
              <Form.Label>Adventure Setting</Form.Label>
              <Form.Control
                type="text"
                value={adventureSetting}
                onChange={(e) => setAdventureSetting(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="worldLore">
              <Form.Label>World Lore (optional)</Form.Label>
              <Form.Control
                as="textarea"
                value={worldLore}
                onChange={(e) => setWorldLore(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="plot">
              <Form.Label>Plot (optional)</Form.Label>
              <Form.Control
                as="textarea"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="context">
              <Form.Label>Context (optional)</Form.Label>
              <Form.Control
                as="textarea"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Create Adventure
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
