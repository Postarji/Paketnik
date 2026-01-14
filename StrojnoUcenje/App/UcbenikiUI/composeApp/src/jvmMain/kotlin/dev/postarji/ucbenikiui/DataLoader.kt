package dev.postarji.ucbenikiui

class DataLoader {
    companion object {
        fun loadBooks(): List<Book> {
            val inputStream = DataLoader::class.java.getResourceAsStream("/data.arff")
            val books = mutableListOf<Book>()

            inputStream?.bufferedReader()?.useLines { lines ->
                var isDataSection = false
                for (line in lines) {
                    if (line.trim().isEmpty() || line.startsWith("%")) {
                        continue
                    }
                    if (line.startsWith("@data")) {
                        isDataSection = true
                        continue
                    }
                    if (isDataSection) {
                        val parts = parseArffRow(line)
                        val book = Book(
                            Index = parts[0].toInt(),
                            Title = parts[1],
                            Genre = parts[2],
                            Description = parts[3],
                            NumberOfPages = parts[4].toInt(),
                            BindingType = parts[5],
                            Cluster = parts[6],
                        )
                        books.add(book)
                    }
                }
            }

            return books
        }

        private fun parseArffRow(line: String): List<String> {
            val tokens = mutableListOf<String>()
            val sb = StringBuilder()
            var inQuotes = false
            var isEscaped = false

            for (char in line) {
                when {
                    char == '\\' && !isEscaped -> {
                        isEscaped = true
                    }

                    (char == '\'' || char == '"') && !isEscaped -> {
                        inQuotes = !inQuotes
                    }

                    char == ',' && !inQuotes -> {
                        tokens.add(sb.toString().trim())
                        sb.clear()
                    }

                    else -> {
                        sb.append(char)
                        isEscaped = false
                    }
                }
            }
            tokens.add(sb.toString().trim())

            return tokens
        }
    }
}
