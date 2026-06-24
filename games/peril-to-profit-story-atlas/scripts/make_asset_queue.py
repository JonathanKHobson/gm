#!/usr/bin/env python3
from pathlib import Path
import json, csv, argparse

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--entities', default='data/required_entity_registry.json')
    ap.add_argument('--scenes', default='data/required_scene_registry.json')
    ap.add_argument('--out', default='data/asset_generation_queue.csv')
    args=ap.parse_args()
    entities=json.loads(Path(args.entities).read_text())
    scenes=json.loads(Path(args.scenes).read_text())
    rows=[]
    for s in scenes:
        rows.append({
            'asset_type':'scene',
            'id':s['id'],
            'name':s['title'],
            'target_path':f"assets/scenes/{s['id']}-{s['title'].lower().replace(' ','-')}.png",
            'required_format':'png/jpg/webp only; no svg',
            'continuity_notes':'Follow scene continuity; no Strixwolf after Act One unless specifically optional.'
        })
    for e in entities:
        rows.append({
            'asset_type':e['type'],
            'id':e['id'],
            'name':e['name'],
            'target_path':f"assets/entities/{e['id']}.png",
            'required_format':'png/jpg/webp only; no svg',
            'continuity_notes':'Generate specific portrait/object/logo, not generic placeholder.'
        })
    Path(args.out).parent.mkdir(exist_ok=True)
    with open(args.out,'w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f'wrote {len(rows)} asset queue rows to {args.out}')
if __name__ == '__main__': main()
