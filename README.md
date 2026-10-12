# FSU Citation Network

Interactive graph of citations between Florida State University papers (2021-2026), using OpenAlex data.

Sarah Fieg (sef21a) · CIS4930/5930, Assignment 1

## Run it

Use two terminals.

**Backend (Flask):**
```
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend (D3):**
```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The backend serves the data at http://127.0.0.1:5000/api/network.

## What you can do

Zoom with the wheel, pan by dragging the background, drag nodes, and hover a node to see its title, year, venue and authors.
