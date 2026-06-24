import json
import csv
import os
import time
import requests
from bs4 import BeautifulSoup
import argparse

def find_teen_tournament_games(num_games_to_find=3):
    """Search recent seasons for Teen Tournament games and return their URLs."""
    print("Searching for Teen Tournament games...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    }

    # We'll check seasons backwards starting from a recent one
    found_urls = []

    for season in range(35, 30, -1):  # Checking seasons 35 down to 31
        if len(found_urls) >= num_games_to_find:
            break

        print(f"Checking Season {season}...")
        url = f"https://j-archive.com/showseason.php?season={season}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            links = soup.find_all('a')
            for link in links:
                href = link.get('href')
                if href and "showgame.php?game_id=" in href:
                    parent_td = link.parent
                    if parent_td:
                        row = parent_td.parent
                        text = row.get_text()
                        if "Teen Tournament" in text:
                            game_url = "https://j-archive.com/" + href
                            if game_url not in found_urls:
                                found_urls.append(game_url)
                                if len(found_urls) >= num_games_to_find:
                                    break
        except Exception as e:
            print(f"Error checking season {season}: {e}")

        time.sleep(2)  # delay between season pages

    return found_urls[:num_games_to_find]

def scrape_game(url, headers):
    """Scrape a single game URL and return its data."""
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract categories for the first round (Jeopardy! Round)
        categories_tags = soup.find_all('td', class_='category_name')
        category_names = [tag.get_text(strip=True) for tag in categories_tags]

        if not category_names:
            return None

        if len(category_names) >= 6:
            round_categories = category_names[:6]
        else:
            round_categories = category_names

        game_data = {
            "tournament": "Teen Tournament",
            "url": url,
            "categories": []
        }

        for cat_name in round_categories:
            game_data["categories"].append({
                "name": cat_name,
                "clues": []
            })

        clue_tds = soup.find_all('td', class_='clue')

        for i, clue_td in enumerate(clue_tds):
            if i >= 30: # Only first round
                break

            cat_index = i % 6
            if cat_index >= len(game_data["categories"]):
                continue

            clue_text_tag = clue_td.find(class_='clue_text')
            clue_text = clue_text_tag.get_text(strip=True) if clue_text_tag else "No Clue"

            correct_response = "Answer not found"
            if clue_text_tag and clue_text_tag.has_attr('id'):
                base_id = clue_text_tag['id']
                correct_td = soup.find(id=f"{base_id}_r")
                if correct_td:
                    correct_response_elem = correct_td.find(class_='correct_response')
                    if correct_response_elem:
                        correct_response = correct_response_elem.get_text(strip=True)

            value_tag = clue_td.find(class_='clue_value')
            value = value_tag.get_text(strip=True) if value_tag else "$?"

            if clue_text and clue_text != "No Clue" and clue_text != "=":
                game_data["categories"][cat_index]["clues"].append({
                    "clue": clue_text,
                    "answer": correct_response,
                    "value": value
                })

        # Clean up empty categories
        game_data["categories"] = [cat for cat in game_data["categories"] if len(cat["clues"]) > 0]

        if game_data["categories"]:
            return game_data

    except Exception as e:
        print(f"Error scraping game {url}: {e}")

    return None

def main():
    parser = argparse.ArgumentParser(description="Scrape Teen Tournament Jeopardy games.")
    parser.add_argument('--count', type=int, default=3, help='Number of games to scrape')
    args = parser.parse_args()

    print("Starting Jeopardy Teen Tournament Scraper...")

    target_urls = find_teen_tournament_games(args.count)
    if not target_urls:
        print("Could not find any Teen Tournament games.")
        return

    print(f"Found {len(target_urls)} games to scrape:")
    for u in target_urls:
        print(f" - {u}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    }

    all_games_data = []

    for idx, url in enumerate(target_urls):
        print(f"Fetching game {idx+1}/{len(target_urls)}: {url}")
        game_data = scrape_game(url, headers)
        if game_data:
            all_games_data.append(game_data)

        print("Waiting 5 seconds to respect the server...")
        time.sleep(5)

    output_data = {"games": all_games_data}

    # Save JSON
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'jeopardy_data.json')
    print(f"Saving data to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4)

    # Save CSVs
    csv_dir = os.path.join(base_dir, 'categories_csv')
    os.makedirs(csv_dir, exist_ok=True)

    # Clear old CSVs
    for file in os.listdir(csv_dir):
        if file.endswith(".csv"):
            os.remove(os.path.join(csv_dir, file))

    print(f"Saving category CSVs to {csv_dir}/...")

    # Using a set to keep track of appended files so we don't overwrite categories that share names
    created_csvs = set()

    for game in output_data["games"]:
        for category in game["categories"]:
            # Sanitize filename
            safe_name = "".join([c for c in category["name"] if c.isalpha() or c.isdigit() or c==' ']).rstrip()
            filename = safe_name.replace(" ", "_") + ".csv"
            filepath = os.path.join(csv_dir, filename)

            mode = 'a' if filepath in created_csvs else 'w'
            with open(filepath, mode, newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if mode == 'w':
                    writer.writerow(['Category', 'Value', 'Clue', 'Correct Response'])
                    created_csvs.add(filepath)
                for clue in category["clues"]:
                    writer.writerow([category["name"], clue["value"], clue["clue"], clue["answer"]])

    print("Scraping completed successfully! Open index.html in this directory to view the games.")

if __name__ == "__main__":
    main()
