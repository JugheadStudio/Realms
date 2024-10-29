"use client";

import { useState } from "react";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";

export default function AdventureSetup() {
	const [characterName, setCharacterName] = useState("");
	const [characterType, setCharacterType] = useState("");
	const [adventureSetting, setAdventureSetting] = useState("");
	const [context, setContext] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!characterName || !characterType || !adventureSetting) {
			setError("Please fill in all required fields.");
			return;
		}

		const roomCode = Math.random().toString(36).slice(2, 8); // Generate a random room code

		try {
			const roomRef = doc(db, "rooms", roomCode);
			await setDoc(roomRef, {
				characterName,
				characterType,
				adventureSetting,
				context,
				createdAt: new Date(),
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
						<Form.Group className="mb-3" controlId="characterName">
							<Form.Label>Character Name</Form.Label>
							<Form.Control
								type="text"
								value={characterName}
								onChange={(e) => setCharacterName(e.target.value)}
								required
							/>
						</Form.Group>

						<Form.Group className="mb-3" controlId="characterType">
							<Form.Label>Character Type</Form.Label>
							<Form.Control
								type="text"
								value={characterType}
								onChange={(e) => setCharacterType(e.target.value)}
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
