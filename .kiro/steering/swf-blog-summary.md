# SWF Blog Ideas Summary

When the user asks to "show summary blog ideas" or "blog ideas summary", run this command against the SWF local database and present the results:

## Command

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx wrangler d1 execute DB --local --command "
SELECT 
  category,
  COUNT(*) as posts,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'analysed' THEN 1 ELSE 0 END) as analysed,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'deployed_staging' THEN 1 ELSE 0 END) as staging,
  SUM(CASE WHEN status = 'deployed_live' THEN 1 ELSE 0 END) as live,
  MIN(estimated_execution_time) as min_time,
  MAX(estimated_execution_time) as max_time
FROM blog_ideas 
GROUP BY category 
ORDER BY MIN(id);
" --json
```

## Expected Output Format

Present as a table:

| Category | Posts | Pending | Analysed | Completed | Staging | Live | Estimate Range | 
|---|---|---|---|---|---|---|---|

Then show totals at the bottom.

## Notes

- All 200 blog ideas are stored in the `blog_ideas` table in SWF's D1 database
- Status flow: `pending` → `analysed` → `completed` → `deployed_staging` → `deployed_live`
- The `estimated_execution_time` field stores time estimates like "15min", "45min", "60min"
- Total estimated execution for all 200 posts: ~93 hours
- Fastest categories: Word Lists (15min), More Letter Guides (15min), Letter-Specific (15-20min)
- Most time-intensive: Strategy (35-60min), Tournament & Competitive (35-50min)
