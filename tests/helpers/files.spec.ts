import { generateFilesPaths } from '../../src'

jest.mock('fs');

describe('files', () => {
  describe('generateFilesPaths', () => {
    const MOCK_FILE_INFO = {
      '/path/to/file1.js': 'console.log("file1 contents");',
      '/path/to/file2.txt': 'file2 contents',
    };

    beforeEach(() => {
      // Set up some mocked out file info before each test
      require('fs').__setMockFiles(MOCK_FILE_INFO);
    });

    it('default', () => {
      const result = generateFilesPaths('/path/to', {})
      expect(result).toEqual({ one: 'NEW' })
    })
  })
})
