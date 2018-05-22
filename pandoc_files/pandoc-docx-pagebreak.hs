module Main where
import Text.Pandoc.JSON
import Text.Pandoc.Definition


pageBreakXml :: String
pageBreakXml = "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>"

pageBreakBlock :: Block
pageBreakBlock = RawBlock (Format "openxml") pageBreakXml


insertPgBrks :: Block -> IO (Block)
insertPgBrks blk  = do
    --print(blk)
    case blk of
        (Para [Str "{{pagebreak}}"]) -> do
            return pageBreakBlock
        _ ->
            return blk


main = toJSONFilter insertPgBrks
