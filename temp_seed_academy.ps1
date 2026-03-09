$ErrorActionPreference='Stop'
$base='https://aam-api.ask-a-muslim.com'
$prefix='AAM_ITG_2026_03_09'

$loginBody=@{email='administrator@ask-a-muslim.com';password='P@ssw0rd'}|ConvertTo-Json
$login=Invoke-RestMethod -Uri "$base/api/Authentication/login" -Method Post -ContentType 'application/json' -Body $loginBody
$token=$login.data.token
if(-not $token){ throw 'Missing token' }
$headers=@{ Authorization = "Bearer $token" }

function Post-Api($path,$body){
  $json=$body|ConvertTo-Json -Depth 10
  Write-Host "POST $path"
  try {
    Invoke-RestMethod -Uri ("$base$path") -Method Post -Headers $headers -ContentType 'application/json' -Body $json
  }
  catch {
    Write-Host "FAILED $path"
    Write-Host "Payload: $json"
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $reader.BaseStream.Position = 0
      $reader.DiscardBufferedData()
      $errorBody = $reader.ReadToEnd()
      Write-Host "Response: $errorBody"
    }
    throw
  }
}

function Get-Id($response) {
  if ($null -eq $response) { return $null }
  if ($response -is [string]) { return $response }
  if ($response.PSObject.Properties.Name -contains 'id') { return $response.id }
  if ($response.PSObject.Properties.Name -contains 'data') {
    $data = $response.data
    if ($data -is [string]) { return $data }
    if ($null -ne $data -and $data.PSObject.Properties.Name -contains 'id') { return $data.id }
  }
  return $null
}

$level = Post-Api '/api/Levels' @{ title = "$prefix Level"; description='Integration seed level'; order=1; difficulty=1; isPublished=$true }
$levelId = Get-Id $level

$course = Post-Api '/api/Courses' @{ levelId=$levelId; title="$prefix Test Course"; description='Integration test course'; objective='Validate academy flow'; thumbnailUrl='https://example.com/thumb.png'; durationInHours=1; order=1; isPublished=$true; tagIds=@() }
$courseId = Get-Id $course

$lessonPayloads = @(
  @{ title="$prefix Intro Lesson"; type=2; description='Intro lesson'; contentJson='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Welcome to this course."}]}]}'; contentUrl=$null; transcript=$null; order=1 },
  @{ title="$prefix Video Lesson"; type=1; description='Video lesson'; contentJson='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Watch the lesson video."}]}]}'; contentUrl='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; transcript='Video transcript'; order=2 },
  @{ title="$prefix Article Lesson"; type=3; description='Article lesson'; contentJson='{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Part 1"}]},{"type":"paragraph","content":[{"type":"text","text":"Article body text."}]}]}'; contentUrl=$null; transcript=$null; order=3 }
)
$lessonIds=@()
foreach($lp in $lessonPayloads){
  $l=Post-Api '/api/Lessons' @{ courseId=$courseId; title=$lp.title; description=$lp.description; contentJson=$lp.contentJson; type=$lp.type; contentUrl=$lp.contentUrl; transcript=$lp.transcript; thumbnailUrl='https://example.com/lesson.png'; order=$lp.order; isPublished=$true }
  $lessonIds += (Get-Id $l)
}

$quizCourseIds=@()
for($i=1;$i -le 3;$i++){
  $qc=Post-Api '/api/Courses' @{ levelId=$levelId; title="$prefix QuizCourse$i"; description="Quiz-only course $i"; objective='Quiz target'; thumbnailUrl='https://example.com/quizcourse.png'; durationInHours=1; order=(10+$i); isPublished=$true; tagIds=@() }
  $quizCourseIds += (Get-Id $qc)
}

$quizIds=@()
for($i=0;$i -lt 3;$i++){
  $cq=Post-Api '/api/Quizzes' @{ courseId=$quizCourseIds[$i]; targetType=2; title="$prefix Course Quiz $($i+1)"; totalMarks=5 }
  $quizIds += (Get-Id $cq)
}
for($i=1;$i -le 3;$i++){
  $sq=Post-Api '/api/Quizzes' @{ levelId=$levelId; targetType=1; title="$prefix Stage Quiz $i"; totalMarks=5 }
  $quizIds += (Get-Id $sq)
}

$questionIds=@()
foreach($quizId in $quizIds){
  for($q=1;$q -le 5;$q++){
    $question=Post-Api '/api/Questions' @{ quizId=$quizId; text="Question $q for quiz $quizId"; order=$q; type=0; points=1 }
    $qid=Get-Id $question
    $questionIds += $qid
    for($o=1;$o -le 4;$o++){
      [void](Post-Api '/api/Options' @{ questionId=$qid; text="Option $o for Q$q"; order=$o; isCorrect=($o -eq 1) })
    }
  }
}

$result=[ordered]@{
  levelId=$levelId
  courseId=$courseId
  lessonIds=$lessonIds
  quizCourseIds=$quizCourseIds
  quizIds=$quizIds
  questionCount=$questionIds.Count
  optionCount=($questionIds.Count*4)
}
$outPath = Join-Path $PWD 'seed-result.json'
$result | ConvertTo-Json -Depth 6 | Set-Content -Path $outPath -Encoding UTF8
Write-Output "SEED_OK:$outPath"
