module Main where
import Text.Pandoc.JSON
import Text.Pandoc.Definition

pageBreakXml :: String
pageBreakXml = "<div style='page-break-after:always'>&nbsp;</div> "

pageBreakBlock :: Block
pageBreakBlock = RawBlock (Format "html") pageBreakXml

insertPgBrks :: Block -> IO (Block)
insertPgBrks blk  = do
    --print(blk)
    case blk of
        (Para [Str "{{pagebreak}}"]) -> do
            return pageBreakBlock
        _ ->
            return blk


main = toJSONFilter insertPgBrks
