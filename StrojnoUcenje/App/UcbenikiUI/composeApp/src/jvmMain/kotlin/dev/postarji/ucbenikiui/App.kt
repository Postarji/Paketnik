package dev.postarji.ucbenikiui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

private val DeepBlue = Color(0xFF0D47A1)
private val LightBlue = Color(0xFFE3F2FD)
private val SkyBlue = Color(0xFF42A5F5)

@Composable
fun App(initialBooks: List<Book>) {
    val allBooks = remember { initialBooks }
    val borrowedBooks = remember { mutableStateListOf<Book>() }

    val recommendedBooks = remember(borrowedBooks.size) {
        if (borrowedBooks.isEmpty()) emptyList()
        else {
            val userClusters = borrowedBooks.map { it.Cluster }.toSet()
            allBooks.filter { book ->
                userClusters.contains(book.Cluster) && borrowedBooks.none { it.Index == book.Index }
            }.shuffled().take(5)
        }
    }

    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = DeepBlue,
            onPrimary = Color.White,
            primaryContainer = LightBlue,
            onPrimaryContainer = DeepBlue,
            secondary = SkyBlue,
            surface = Color.White
        )
    ) {
        Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFFF8FAFC)) {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 320.dp),
                contentPadding = PaddingValues(24.dp),
                verticalArrangement = Arrangement.spacedBy(32.dp),
                horizontalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    Column {
                        Text(
                            "Izposoja knjig",
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = DeepBlue
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Divider(thickness = 3.dp, color = SkyBlue, modifier = Modifier.width(80.dp))
                    }
                }

                item(span = { GridItemSpan(maxLineSpan) }) {
                    SectionHeader("Moje izposojene knjige")
                }

                if (borrowedBooks.isEmpty()) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        EmptyStateBox("Trenutno nimate izposojenih knjig.")
                    }
                } else {
                    items(borrowedBooks) { book ->
                        BookCard(
                            book = book,
                            buttonText = "Vrni knjigo",
                            buttonColor = Color(0xFFEF5350),
                            onAction = { borrowedBooks.remove(book) }
                        )
                    }
                }

                if (recommendedBooks.isNotEmpty()) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        SectionHeader("Priporočamo za vas ✨")
                    }
                    items(recommendedBooks) { book ->
                        BookCard(
                            book = book,
                            buttonText = "Izposodi si",
                            buttonColor = DeepBlue,
                            onAction = { borrowedBooks.add(book) }
                        )
                    }
                }

                item(span = { GridItemSpan(maxLineSpan) }) {
                    SectionHeader("Celoten seznam knjig")
                }

                items(allBooks) { book ->
                    val isAlreadyBorrowed = borrowedBooks.any { it.Index == book.Index }
                    BookCard(
                        book = book,
                        buttonText = if (isAlreadyBorrowed) "Že izposojeno" else "Izposodi si",
                        buttonColor = if (isAlreadyBorrowed) Color.Gray else DeepBlue,
                        enabled = !isAlreadyBorrowed,
                        onAction = { if (!isAlreadyBorrowed) borrowedBooks.add(book) }
                    )
                }
            }
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        color = DeepBlue,
        modifier = Modifier.padding(bottom = 8.dp)
    )
}

@Composable
fun EmptyStateBox(text: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(LightBlue.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        Text(text, color = DeepBlue, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
fun BookCard(
    book: Book,
    buttonText: String,
    buttonColor: Color,
    enabled: Boolean = true,
    onAction: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth().height(500.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = Color.White)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1.2f)
                    .background(LightBlue)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                val resourceName = book.Genre.lowercase().trim().replace(" ", "_") + ".png"

                Image(
                    painter = painterResource(resourceName),
                    contentDescription = book.Title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            }

            Column(
                modifier = Modifier.weight(1.8f).padding(20.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Surface(
                        color = LightBlue,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = book.Genre,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelMedium,
                            color = DeepBlue,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = book.Title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        color = Color(0xFF1A1A1A)
                    )

                    Text(
                        text = "${book.NumberOfPages} strani • ${book.BindingType}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = book.Description,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 4,
                        overflow = TextOverflow.Ellipsis,
                        color = Color(0xFF444444),
                        lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.2f
                    )
                }

                Button(
                    onClick = onAction,
                    enabled = enabled,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = buttonColor,
                        disabledContainerColor = Color.LightGray
                    )
                ) {
                    Text(buttonText, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}