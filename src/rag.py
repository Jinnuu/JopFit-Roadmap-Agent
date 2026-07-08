import os
import re
from typing import List, Dict, Any

def search_documents(query: str, docs_dir: str = None) -> List[Dict[str, Any]]:
    """
    Simple keyword-based Markdown document search.
    Loads documents from the docs/ directory and returns list of dictionaries containing:
    - title: Document title (parsed from first line # Heading or filename)
    - path: Relative file path from project root
    - snippet: Text snippet matching query keywords
    - score: Normalized keyword match score
    """
    if not docs_dir:
        # Default to docs/ folder in workspace root
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        docs_dir = os.path.join(base_dir, "docs")
    
    if not os.path.exists(docs_dir):
        return []
    
    results = []
    # Tokenize query into alphanumeric keywords (excluding short single characters)
    keywords = [kw.lower() for kw in re.findall(r'[a-zA-Z0-9가-힣]+', query) if len(kw) > 1]
    
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if not file.endswith(".md"):
                continue
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                continue
            
            # Parse title from the first header or fallback to filename
            first_line = content.split("\n")[0]
            title = first_line.replace("#", "").strip() if first_line.startswith("#") else file
            
            # Calculate match score based on keyword frequency
            score = 0.0
            content_lower = content.lower()
            if keywords:
                matched_count = sum(1 for kw in keywords if kw in content_lower)
                score = matched_count / len(keywords)
            
            # Add to results if we have matches, or if no query keywords were extractable
            if score > 0 or not keywords:
                # Find the location of the first keyword match to build a relevant snippet
                first_match_idx = -1
                for kw in keywords:
                    idx = content_lower.find(kw)
                    if idx != -1:
                        first_match_idx = idx
                        break
                
                if first_match_idx != -1:
                    start = max(0, first_match_idx - 50)
                    end = min(len(content), first_match_idx + 150)
                    snippet = "..." + content[start:end].replace("\n", " ").strip() + "..."
                else:
                    snippet = content[:200].replace("\n", " ").strip() + "..."
                
                # Build relative path
                rel_path = os.path.relpath(file_path, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                rel_path = rel_path.replace("\\", "/")
                
                results.append({
                    "title": title,
                    "path": rel_path,
                    "snippet": snippet,
                    "score": round(score, 2)
                })
                
    # Sort results by score in descending order
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
