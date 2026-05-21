import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase"; // Your setup file!
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestDemo() {
    // --- STATE (The Short-Term Whiteboard) ---
    const [notes, setNotes] = useState<string[]>([]);
    const [newNote, setNewNote] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    // --- EFFECT (Runs once when the page loads) ---
    useEffect(() => {
        async function loadUserData() {
            // 1. Ask Supabase for the current user's ID badge
            const { data: authData } = await supabase.auth.getUser();

            if (authData.user) {
                setUserId(authData.user.id); // Save the ID to our whiteboard

                // 2. Fetch only THIS user's notes from the filing cabinet
                const { data: tableData, error } = await supabase
                    .from("test_notes")
                    .select("note_text")
                    .eq("user_id", authData.user.id);

                if (tableData) {
                    // 3. Write the database data onto the React whiteboard
                    const stringArray = tableData.map((row) => row.note_text);
                    setNotes(stringArray);
                }
            }
        }

        loadUserData();
    }, []); // The empty [] means "only run this on page load"


    // --- ACTION (When they click the save button) ---
    async function handleSaveNote() {
        if (!newNote || !userId) return; // Don't save empty notes

        // 1. INSTANT UI UPDATE: Add it to the whiteboard immediately
        setNotes([...notes, newNote]);
        setNewNote(""); // Clear the input box

        // 2. BACKUP: Save it to the Supabase filing cabinet
        const { error } = await supabase
            .from("test_notes")
            .insert({
                user_id: userId,
                note_text: newNote,
            });

        if (error) {
            alert("Failed to save to cloud: " + error.message);
        }
    }


    // --- UI (What the user sees) ---
    return (
        <div className="p-10 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Secret Notes</h1>

            {/* The Input Area */}
            <div className="flex gap-2 mb-6">
                <Input
                    placeholder="Type a meaningless note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={handleSaveNote}>Save</Button>
            </div>

            {/* The Display Area */}
            <ul className="space-y-2">
                {notes.length === 0 ? (
                    <p className="text-gray-500">No notes saved yet!</p>
                ) : (
                    notes.map((note, index) => (
                        <li key={index} className="p-3 bg-gray-100 rounded-md">
                            {note}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
