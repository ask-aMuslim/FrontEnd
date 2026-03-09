$ErrorActionPreference='Stop'
$base='https://aam-api.ask-a-muslim.com'
$seed = Get-Content .\seed-result.json | ConvertFrom-Json

$adminLogin = Invoke-RestMethod -Uri "$base/api/Authentication/login" -Method Post -ContentType 'application/json' -Body (@{email='administrator@ask-a-muslim.com';password='P@ssw0rd'}|ConvertTo-Json)
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.data.token)" }

function Unwrap($resp) {
  if ($null -eq $resp) { return $null }
  if ($resp -is [array]) { return $resp }
  if ($resp -is [string]) { return $resp }
  if ($resp.PSObject.Properties.Name -contains 'items' -and $resp.items -is [array]) { return $resp.items }
  if ($resp.PSObject.Properties.Name -contains 'Items' -and $resp.Items -is [array]) { return $resp.Items }
  if ($resp.PSObject.Properties.Name -contains 'data') {
    $data = $resp.data
    if ($data -is [array]) { return $data }
    if ($data -is [string]) { return $data }
    if ($data -and $data.PSObject.Properties.Name -contains 'items' -and $data.items -is [array]) { return $data.items }
    if ($data -and $data.PSObject.Properties.Name -contains 'Items' -and $data.Items -is [array]) { return $data.Items }
    return $data
  }
  return $resp
}

function Check-Schema($name, $items, $requiredFields, $allowedFields) {
  $mismatches = @()
  $arr = @()
  if ($items -is [array]) { $arr = $items } elseif ($null -ne $items) { $arr = @($items) }
  foreach ($item in $arr) {
    if ($null -eq $item -or -not ($item -is [object])) { continue }
    $keys = @($item.PSObject.Properties.Name)

    foreach ($req in $requiredFields) {
      if (-not ($keys -contains $req)) {
        $mismatches += "[SCHEMA_MISMATCH] ${name}: missing required field '$req'"
      } elseif ($null -eq $item.$req) {
        $mismatches += "[SCHEMA_MISMATCH] ${name}: required field '$req' is null"
      }
    }

    foreach ($k in $keys) {
      if (-not ($allowedFields -contains $k)) {
        $mismatches += "[SCHEMA_MISMATCH] ${name}: field '$k' not in DTO"
      }
    }
  }
  return $mismatches
}

$report = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  checks = @()
  mismatches = @()
}

# Levels
$levelsResp = Invoke-RestMethod -Uri "$base/api/Levels?PageNumber=1&PageSize=50" -Method Get -Headers $adminHeaders
$levels = @(Unwrap $levelsResp)
$levelsAllowed = @('id','title','description','order','difficulty','isPublished')
$levelsRequired = @('id','title')
$mm = Check-Schema 'GET /api/Levels' $levels $levelsRequired $levelsAllowed
$report.checks += @{ endpoint='GET /api/Levels'; count=$levels.Count; status='ok' }
$report.mismatches += $mm

# Courses
$coursesResp = Invoke-RestMethod -Uri "$base/api/Courses?PageNumber=1&PageSize=100&LevelId=$($seed.levelId)" -Method Get -Headers $adminHeaders
$courses = @(Unwrap $coursesResp)
$coursesAllowed = @('id','title','category','level','levelId','numberOfLessons','lessons','instructorID','instructorName','numberOfStudentsEnrolled','thumbnailUrl','description','order','isPublished','prerequisites')
$coursesRequired = @('id','title')
$mm = Check-Schema 'GET /api/Courses' $courses $coursesRequired $coursesAllowed
$report.checks += @{ endpoint='GET /api/Courses'; count=$courses.Count; status='ok' }
$report.mismatches += $mm

# Lessons
$lessonsResp = Invoke-RestMethod -Uri "$base/api/Lessons?PageNumber=1&PageSize=100&CourseId=$($seed.courseId)" -Method Get -Headers $adminHeaders
$lessons = @(Unwrap $lessonsResp)
$lessonsAllowed = @('id','courseId','title','description','content','type','videoUrl','externalVideoUrl','thumbnailUrl','order')
$lessonsRequired = @('id','courseId','title')
$mm = Check-Schema 'GET /api/Lessons' $lessons $lessonsRequired $lessonsAllowed
$report.checks += @{ endpoint='GET /api/Lessons'; count=$lessons.Count; status='ok' }
$report.mismatches += $mm

# Quizzes
$quizzesResp = Invoke-RestMethod -Uri "$base/api/Quizzes?PageNumber=1&PageSize=100&LevelId=$($seed.levelId)" -Method Get -Headers $adminHeaders
$quizzes = @(Unwrap $quizzesResp)
$quizzesAllowed = @('id','title','lessonId','courseId','levelId','targetType','totalMarks')
$quizzesRequired = @('id','title')
$mm = Check-Schema 'GET /api/Quizzes' $quizzes $quizzesRequired $quizzesAllowed
$report.checks += @{ endpoint='GET /api/Quizzes'; count=$quizzes.Count; status='ok' }
$report.mismatches += $mm

# Questions + Options by first seeded quiz
$qid = $seed.quizIds[0]
$questionsResp = Invoke-RestMethod -Uri "$base/api/Questions?PageNumber=1&PageSize=50&QuizId=$qid" -Method Get -Headers $adminHeaders
$questions = @(Unwrap $questionsResp)
$questionsAllowed = @('id','quizId','text')
$questionsRequired = @('id','quizId','text')
$mm = Check-Schema 'GET /api/Questions' $questions $questionsRequired $questionsAllowed
$report.checks += @{ endpoint='GET /api/Questions'; count=$questions.Count; status='ok' }
$report.mismatches += $mm

if ($questions.Count -gt 0) {
  $questionId = $questions | Where-Object { $_.id -is [string] -and $_.id.Length -gt 0 } | Select-Object -First 1 -ExpandProperty id
  if ($questionId) {
    try {
      $optionsResp = Invoke-RestMethod -Uri "$base/api/Options/by-question/$questionId" -Method Get -Headers $adminHeaders
      $options = @(Unwrap $optionsResp)
      $optionsAllowed = @('id','questionId','text','isCorrect')
      $optionsRequired = @('id','questionId','text')
      $mm = Check-Schema 'GET /api/Options/by-question/{id}' $options $optionsRequired $optionsAllowed
      $report.checks += @{ endpoint='GET /api/Options/by-question/{id}'; count=$options.Count; status='ok' }
      $report.mismatches += $mm
    }
    catch {
      $report.checks += @{ endpoint='GET /api/Options/by-question/{id}'; count=0; status='error' }
      $report.mismatches += "[INTEGRATION_ERROR] GET /api/Options/by-question/{id}: request failed"
    }
  } else {
    $report.checks += @{ endpoint='GET /api/Options/by-question/{id}'; count=0; status='skipped' }
    $report.mismatches += "[SCHEMA_MISMATCH] GET /api/Questions: missing usable question id for options lookup"
  }
}

$out = Join-Path $PWD 'contract-validation-report.json'
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $out -Encoding UTF8
Write-Output "CONTRACT_REPORT:$out"
